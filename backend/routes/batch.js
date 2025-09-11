const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../data/uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.json', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV, JSON, and XLSX files are allowed.'));
    }
  }
});

const PYTHON_API_BASE = process.env.PYTHON_API_URL || 'http://localhost:3000';

// JobManager will be injected via middleware
let jobManager = null;

// Middleware to inject JobManager
router.use((req, res, next) => {
  jobManager = req.app.locals.jobManager;
  next();
});

// Helper function to call Python API
async function callPythonAPI(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${PYTHON_API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(`Python API error: ${error.response?.data?.detail || error.message}`);
  }
}

// Create comprehensive batch job
router.post('/jobs', upload.single('dataFile'), async (req, res) => {
  try {
    const {
      jobName,
      processingType,
      priority = 'normal',
      batchSize = 1000,
      outputFormat = 'csv',
      matchThreshold = 0.85,
      useAI = true,
      createdBy = 'web_user'
    } = req.body;
    
    let inputData;
    
    if (req.file) {
      // File uploaded - store file path and metadata
      inputData = {
        type: 'file',
        path: req.file.path,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    } else if (req.body.inputData || req.body.input_data) {
      // Data provided in request body
      const rawData = req.body.inputData || req.body.input_data;
      try {
        inputData = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      } catch (error) {
        inputData = rawData;
      }
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'No input data provided. Please upload a file or provide data in the request body.'
      });
    }
    
    const jobRequest = {
      name: jobName,
      job_type: processingType,
      input_data: inputData,
      config: {
        batch_size: parseInt(batchSize),
        output_format: outputFormat,
        match_threshold: parseFloat(matchThreshold),
        use_ai: useAI === 'true' || useAI === true
      },
      output_config: {
        format: outputFormat,
        include_metadata: true,
        anonymize_fields: []
      },
      priority,
      created_by: createdBy
    };

    // Use JobManager to create and process the job
    if (jobManager) {
      const result = await jobManager.createJob(jobRequest);
      
      res.json({
        status: 'success',
        job_id: result.job_id,
        message: 'Batch job created successfully',
        job_name: jobName,
        processing_type: processingType,
        priority
      });
    } else {
      // Fallback to Python API if JobManager not available
      try {
        const response = await callPythonAPI('/api/v1/batch/jobs', 'POST', jobRequest);
        
        res.json({
          status: 'success',
          job_id: response.job_id,
          message: 'Batch job created successfully',
          job_name: jobName,
          processing_type: processingType,
          priority
        });
      } catch (apiError) {
        // If both JobManager and API fail, create a demo job
        const demoJobId = uuidv4();
        logger.warn(`Creating demo job ${demoJobId} due to API unavailability`);
        
        res.json({
          status: 'success',
          job_id: demoJobId,
          message: 'Demo batch job created successfully',
          job_name: jobName,
          processing_type: processingType,
          priority,
          demo: true
        });
      }
    }
    
  } catch (error) {
    logger.error('Error creating batch job:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create batch job',
      error: error.message
    });
  }
});

// Submit batch job (legacy endpoint for backward compatibility)
router.post('/submit', async (req, res) => {
  try {
    const {
      jobName = `Batch Job ${new Date().toISOString()}`,
      processingType = 'identity_matching',
      inputData,
      record_count = 0
    } = req.body;
    
    const jobRequest = {
      name: jobName,
      job_type: processingType,
      input_data: inputData || [],
      config: {
        batch_size: 1000,
        output_format: 'csv',
        match_threshold: 0.85,
        use_ai: true
      },
      priority: 'normal',
      created_by: 'legacy_api'
    };
    
    const response = await callPythonAPI('/api/v1/batch/jobs', 'POST', jobRequest);
    
    res.json({
      status: 'success',
      batch_id: response.job_id,
      message: 'Batch job queued for processing',
      estimated_completion: new Date(Date.now() + 3600000).toISOString(),
      record_count
    });
  } catch (error) {
    console.error('Error submitting batch job:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit batch job',
      error: error.message
    });
  }
});

// Get all batch jobs
router.get('/jobs', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0, job_type, created_by } = req.query;
    
    const filters = {
      limit,
      offset
    };
    
    if (status) filters.status_filter = status;
    if (job_type) filters.job_type = job_type;
    if (created_by) filters.created_by = created_by;

    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.getJobs(filters);
      res.json(result);
    } else {
      // Fallback to Python API
      const params = new URLSearchParams();
      if (status) params.append('status_filter', status);
      params.append('limit', limit);
      params.append('offset', offset);
      
      const response = await callPythonAPI(`/api/v1/batch/jobs?${params}`);
      res.json(response);
    }
  } catch (error) {
    logger.error('Error getting batch jobs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get batch jobs',
      error: error.message
    });
  }
});

// Get specific batch job status
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.getJob(jobId);
      res.json(result);
    } else {
      // Fallback to Python API
      const response = await callPythonAPI(`/api/v1/batch/jobs/${jobId}`);
      res.json(response);
    }
  } catch (error) {
    logger.error('Error getting job status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get job status',
      error: error.message
    });
  }
});

// Cancel batch job
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.cancelJob(jobId);
      res.json(result);
    } else {
      // Fallback to Python API
      const response = await callPythonAPI(`/api/v1/batch/jobs/${jobId}`, 'DELETE');
      res.json(response);
    }
  } catch (error) {
    logger.error('Error cancelling job:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel job',
      error: error.message
    });
  }
});

// Pause batch job
router.post('/jobs/:jobId/pause', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.pauseJob(jobId);
      res.json(result);
    } else {
      // Fallback to Python API
      const response = await callPythonAPI(`/api/v1/batch/jobs/${jobId}/pause`, 'POST');
      res.json(response);
    }
  } catch (error) {
    logger.error('Error pausing job:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to pause job',
      error: error.message
    });
  }
});

// Resume batch job
router.post('/jobs/:jobId/resume', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.resumeJob(jobId);
      res.json(result);
    } else {
      // Fallback to Python API
      const response = await callPythonAPI(`/api/v1/batch/jobs/${jobId}/resume`, 'POST');
      res.json(response);
    }
  } catch (error) {
    logger.error('Error resuming job:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to resume job',
      error: error.message
    });
  }
});

// Get batch job results
router.get('/jobs/:jobId/results', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { page = 1, limit = 100, status_filter } = req.query;
    
    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.getJobResults(jobId, { page, limit, status_filter });
      res.json(result);
    } else {
      // Fallback to Python API
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (status_filter) params.append('status_filter', status_filter);
      
      const response = await callPythonAPI(`/api/v1/batch/jobs/${jobId}/results?${params}`);
      res.json(response);
    }
  } catch (error) {
    logger.error('Error getting job results:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get job results',
      error: error.message
    });
  }
});

// Export batch job results
router.get('/jobs/:jobId/export', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { format = 'csv' } = req.query;
    
    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.exportJobResults(jobId, format);
      res.json(result);
    } else {
      // Fallback to Python API
      const response = await callPythonAPI(`/api/v1/batch/jobs/${jobId}/export?format=${format}`);
      res.json(response);
    }
  } catch (error) {
    logger.error('Error exporting job results:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to export job results',
      error: error.message
    });
  }
});

// Get queue statistics
router.get('/queue/statistics', async (req, res) => {
  try {
    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.getQueueStatistics();
      res.json(result);
    } else {
      // Fallback to Python API
      const response = await callPythonAPI('/api/v1/batch/queue/statistics');
      res.json(response);
    }
  } catch (error) {
    logger.error('Error getting queue statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get queue statistics',
      error: error.message
    });
  }
});

// Get batch processing statistics
router.get('/statistics', async (req, res) => {
  try {
    // Use JobManager if available
    if (jobManager) {
      const result = await jobManager.getBatchStatistics();
      res.json({
        status: 'success',
        statistics: result
      });
    } else {
      // Fallback with mock data if JobManager not available
      res.json({
        status: 'success',
        statistics: {
          active_jobs: 0,
          completed_today: 0,
          queued_jobs: 0,
          processing_rate_per_hour: 0,
          total_jobs: 0,
          failed_jobs: 0,
          success_rate: 0,
          avg_processing_time: 0
        }
      });
    }
  } catch (error) {
    logger.error('Error getting batch statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get batch statistics',
      error: error.message
    });
  }
});

// Legacy endpoints for backward compatibility

// Get batch status (legacy)
router.get('/:batchId/status', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const response = await callPythonAPI(`/api/v1/batch/jobs/${batchId}`);
    
    if (response.status === 'success' && response.job) {
      const job = response.job;
      res.json({
        status: 'success',
        batch_id: job.job_id,
        job_status: job.status,
        progress: job.progress,
        total_records: job.total_records,
        processed_records: job.processed_records,
        successful_matches: job.successful_records,
        failed_matches: job.failed_records,
        started_at: job.started_at,
        estimated_completion: job.estimated_completion
      });
    } else {
      res.status(404).json({
        status: 'error',
        message: 'Batch job not found'
      });
    }
  } catch (error) {
    console.error('Error getting batch status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get batch status',
      error: error.message
    });
  }
});

// Get batch results (legacy)
router.get('/:batchId/results', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { page = 1, limit = 100 } = req.query;
    
    const response = await callPythonAPI(`/api/v1/batch/jobs/${batchId}/results?page=${page}&limit=${limit}`);
    
    if (response.status === 'success') {
      res.json({
        status: 'success',
        batch_id: response.job_id,
        page: response.page,
        limit: response.limit,
        total_pages: Math.ceil(response.total_records / response.limit),
        results: response.results
      });
    } else {
      res.json(response);
    }
  } catch (error) {
    console.error('Error getting batch results:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get batch results',
      error: error.message
    });
  }
});

module.exports = router;