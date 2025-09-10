const express = require('express');
const axios = require('axios');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Identity resolution endpoint
router.post('/resolve', async (req, res, next) => {
  try {
    const { demographic_data, source_system, match_threshold = 0.85 } = req.body;
    
    // Generate transaction ID if not provided
    const transaction_id = req.body.transaction_id || uuidv4();
    
    // Call Python matching engine
    const matchingEngineUrl = process.env.MATCHING_ENGINE_URL || 'http://localhost:8000';
    
    const response = await axios.post(`${matchingEngineUrl}/api/v1/resolve`, {
      demographic_data,
      source_system,
      transaction_id,
      match_threshold,
      use_ml: true
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Identity resolution error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Identity resolution failed',
      error: error.message
    });
  }
});

// Search identities
router.get('/search', async (req, res) => {
  try {
    const { first_name, last_name, dob } = req.query;
    
    // Mock search results
    const results = [
      {
        identity_id: 'IDX' + Math.random().toString(36).substr(2, 9),
        first_name,
        last_name,
        dob,
        confidence: 0.95,
        systems: ['DMV', 'HEALTH_DEPT']
      }
    ];
    
    res.json({
      status: 'success',
      results,
      count: results.length
    });
  } catch (error) {
    next(error);
  }
});

// Get identity by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock identity data
    const identity = {
      identity_id: id,
      demographic_data: {
        first_name: 'John',
        last_name: 'Doe',
        dob: '1990-01-15',
        ssn_last4: '1234'
      },
      systems: ['DMV', 'HEALTH_DEPT', 'SOCIAL_SERVICES'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    res.json({
      status: 'success',
      data: identity
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;