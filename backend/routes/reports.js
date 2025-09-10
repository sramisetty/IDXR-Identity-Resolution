const express = require('express');
const router = express.Router();

// Get system statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = {
      total_identities: 1250000,
      total_matches_today: 45678,
      average_confidence: 0.92,
      average_response_time_ms: 235,
      success_rate: 0.98,
      active_systems: 12,
      last_updated: new Date().toISOString()
    };
    
    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// Get match quality report
router.get('/match-quality', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const report = {
      period: {
        start: start_date || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: end_date || new Date().toISOString()
      },
      metrics: {
        total_matches: 320000,
        deterministic_matches: 180000,
        probabilistic_matches: 120000,
        ml_enhanced_matches: 20000,
        average_confidence: 0.91,
        false_positive_rate: 0.008,
        false_negative_rate: 0.015
      },
      confidence_distribution: {
        '0.95-1.00': 45,
        '0.90-0.95': 30,
        '0.85-0.90': 20,
        '0.80-0.85': 5
      }
    };
    
    res.json({
      status: 'success',
      data: report
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate match quality report',
      error: error.message
    });
  }
});

// Get system performance report
router.get('/performance', async (req, res) => {
  try {
    const performance = {
      current: {
        cpu_usage: 35,
        memory_usage: 62,
        disk_usage: 48,
        active_connections: 245,
        queue_size: 12
      },
      hourly_metrics: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        requests: Math.floor(Math.random() * 5000) + 1000,
        avg_response_time: Math.floor(Math.random() * 100) + 150,
        error_rate: Math.random() * 0.02
      }))
    };
    
    res.json({
      status: 'success',
      data: performance
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get performance report',
      error: error.message
    });
  }
});

module.exports = router;