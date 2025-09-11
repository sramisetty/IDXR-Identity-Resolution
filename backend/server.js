const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
require('dotenv').config();

const identityRoutes = require('./routes/identity');
const batchRoutes = require('./routes/batch');
const reportRoutes = require('./routes/reports');
const healthRoutes = require('./routes/health');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');
const logger = require('./utils/logger');

// Import new services
const JobManager = require('./services/JobManager');
const WebSocketService = require('./services/WebSocketService');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize services
let jobManager;
let webSocketService;

async function initializeServices() {
  try {
    // Initialize JobManager
    jobManager = new JobManager();
    logger.info('JobManager initialized successfully');

    // Make jobManager available to routes
    app.locals.jobManager = jobManager;

    // Initialize WebSocket service
    webSocketService = new WebSocketService(server, jobManager);
    logger.info('WebSocket service initialized successfully');

  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Trust proxy for rate limiting to work correctly behind nginx
app.set('trust proxy', true);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Rate limiting temporarily disabled for WebSocket testing
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 500, // limit each IP to 500 requests per windowMs (more generous for polling)
//   message: 'Too many requests from this IP, please try again later.'
// });
// app.use('/api', limiter);

// Body parsing and compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Static file serving for documentation and frontend
app.use('/docs', express.static('docs'));
app.use('/frontend', express.static('frontend'));
app.use('/', express.static('frontend'));

// Public routes
app.use('/api/health', healthRoutes);

// Add health endpoint to v1 API as well for consistency
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Protected routes
app.use('/api/v1/identity', authenticate, identityRoutes);
app.use('/api/v1/batch', authenticate, batchRoutes);
app.use('/api/v1/reports', authenticate, reportRoutes);

// Add WebSocket connection stats endpoint
app.get('/api/v1/websocket/stats', authenticate, (req, res) => {
  if (webSocketService) {
    const stats = webSocketService.getConnectionStats();
    res.json({
      status: 'success',
      ...stats
    });
  } else {
    res.status(503).json({
      status: 'error',
      message: 'WebSocket service not available'
    });
  }
});

// Add audit logs endpoint
app.get('/api/v1/audit', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const { limit = 1000, offset = 0, job_id, action_type } = req.query;
      const result = await jobManager.getAuditLogs({ limit, offset, job_id, action_type });
      res.json(result);
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting audit logs:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get audit logs',
      error: error.message
    });
  }
});

// Add job insights and analytics endpoints
app.get('/api/v1/insights/performance', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const { timeframe = '24h' } = req.query;
      const result = await jobManager.getPerformanceInsights(timeframe);
      res.json({
        status: 'success',
        insights: result
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting performance insights:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get performance insights',
      error: error.message
    });
  }
});

app.get('/api/v1/insights/trends', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const { days = 7 } = req.query;
      const result = await jobManager.getTrends(parseInt(days));
      res.json({
        status: 'success',
        trends: result
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting trends:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get trends',
      error: error.message
    });
  }
});

app.get('/api/v1/insights/summary', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const summary = await jobManager.getJobSummary();
      res.json({
        status: 'success',
        summary
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting job summary:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get job summary',
      error: error.message
    });
  }
});

// Comprehensive dashboard data endpoint
app.get('/api/v1/dashboard', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const dashboardData = jobManager.getDashboardData();
      res.json({
        status: 'success',
        dashboard: dashboardData
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting dashboard data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get dashboard data',
      error: error.message
    });
  }
});

// Algorithm performance endpoint
app.get('/api/v1/algorithms/performance', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const algorithmData = jobManager.metricsCollector.getAlgorithmPerformance();
      res.json({
        status: 'success',
        algorithms: algorithmData
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting algorithm performance:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get algorithm performance',
      error: error.message
    });
  }
});

// Data sources statistics endpoint
app.get('/api/v1/data-sources/stats', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const dataSourceStats = jobManager.metricsCollector.getDataSourceSummary();
      res.json({
        status: 'success',
        data_sources: dataSourceStats
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting data source stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get data source stats',
      error: error.message
    });
  }
});

// Real-time metrics endpoint
app.get('/api/v1/metrics/realtime', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const realTimeMetrics = jobManager.metricsCollector.getRealTimeMetrics();
      res.json({
        status: 'success',
        metrics: realTimeMetrics
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting real-time metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get real-time metrics',
      error: error.message
    });
  }
});

// Processing statistics endpoint
app.get('/api/v1/processing/stats', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const processingStats = jobManager.metricsCollector.getProcessingStatsSummary();
      res.json({
        status: 'success',
        processing_stats: processingStats
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting processing stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get processing stats',
      error: error.message
    });
  }
});

// Top performing algorithms endpoint
app.get('/api/v1/algorithms/top', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const topAlgorithms = jobManager.metricsCollector.getTopPerformingAlgorithms();
      res.json({
        status: 'success',
        top_algorithms: topAlgorithms
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting top algorithms:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get top algorithms',
      error: error.message
    });
  }
});

// Resource usage endpoint
app.get('/api/v1/system/resources', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const resourceUsage = jobManager.metricsCollector.getCurrentResourceUsage();
      res.json({
        status: 'success',
        resources: resourceUsage
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting resource usage:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get resource usage',
      error: error.message
    });
  }
});

// Quality overview endpoint
app.get('/api/v1/quality/overview', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const qualityOverview = jobManager.metricsCollector.getQualityOverview();
      res.json({
        status: 'success',
        quality: qualityOverview
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting quality overview:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get quality overview',
      error: error.message
    });
  }
});

// Error metrics endpoint
app.get('/api/v1/errors/metrics', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const errorMetrics = jobManager.metricsCollector.getErrorMetrics();
      res.json({
        status: 'success',
        error_metrics: errorMetrics
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting error metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get error metrics',
      error: error.message
    });
  }
});

// Statistics endpoint for overview page
app.get('/api/v1/statistics', authenticate, async (req, res) => {
  try {
    if (jobManager) {
      const statistics = jobManager.metricsCollector.getSystemStatistics();
      res.json({
        status: 'success',
        timestamp: new Date().toISOString(),
        ...statistics
      });
    } else {
      res.status(503).json({
        status: 'error',
        message: 'JobManager service not available'
      });
    }
  } catch (error) {
    logger.error('Error getting system statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system statistics',
      error: error.message
    });
  }
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
    path: req.originalUrl
  });
});

// Initialize services and start server
initializeServices().then(() => {
  server.listen(PORT, '127.0.0.1', () => {
    logger.info(`IDXR Backend Server running on 127.0.0.1:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info('WebSocket server running on same port');
    logger.info(`WebSocket accessible via nginx proxy with custom path`);
  });
}).catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  
  if (webSocketService) {
    await webSocketService.shutdown();
  }
  
  if (jobManager) {
    await jobManager.shutdown();
  }
  
  server.close(() => {
    logger.info('Server shutdown complete');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  
  if (webSocketService) {
    await webSocketService.shutdown();
  }
  
  if (jobManager) {
    await jobManager.shutdown();
  }
  
  server.close(() => {
    logger.info('Server shutdown complete');
    process.exit(0);
  });
});