const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  
  // Validation errors
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  
  // Database errors
  if (err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Database connection failed';
  }
  
  res.status(status).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };