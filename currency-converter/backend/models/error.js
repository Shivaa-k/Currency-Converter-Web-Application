const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error'
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error.message = message;
    return res.status(400).json(error);
  }

  // Duplicate key error
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry found';
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(error);
};

module.exports = errorHandler;