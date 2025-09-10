const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    // For demo purposes, we'll allow requests without authentication
    // In production, uncomment the authentication logic below
    
    // Skip authentication for demo
    req.user = {
      id: 'demo_user',
      agency: 'DEMO_AGENCY',
      role: 'admin'
    };
    return next();
    
    /* Production authentication code:
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No authentication token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo_secret');
    req.user = decoded;
    next();
    */
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid authentication token',
      error: error.message
    });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    if (roles && !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

module.exports = { authenticate, authorize };