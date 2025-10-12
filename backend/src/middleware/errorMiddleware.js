import { fail } from '../utils/response.js';

// Handle 404 errors
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user?.id || 'anonymous'
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, status: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    
    // Extract field name from error
    const field = Object.keys(err.keyValue)[0];
    if (field === 'email') {
      message = 'Email address is already registered';
    } else if (field === 'phone') {
      message = 'Phone number is already registered';
    }
    
    error = { message, status: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, status: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, status: 401 };
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, status: 400 };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = 'Too many files';
    error = { message, status: 400 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, status: 400 };
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, status: 429 };
  }

  // Database connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    const message = 'Database connection error';
    error = { message, status: 500 };
  }

  // Cloudinary errors
  if (err.name === 'CloudinaryError') {
    const message = 'Image upload failed';
    error = { message, status: 400 };
  }

  // Default to 500 server error
  const status = error.status || err.status || 500;
  const message = error.message || 'Server Error';

  // Send error response
  return fail(res, message, status, process.env.NODE_ENV === 'development' ? {
    stack: err.stack,
    error: err
  } : undefined);
};

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler
export const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return fail(res, 'Validation failed', 400, { errors: errorMessages });
  }
  
  next();
};

// Development error handler (detailed)
export const developmentErrorHandler = (err, req, res, next) => {
  console.error('Development Error Details:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code,
    status: err.status,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
    user: req.user
  });

  return res.status(err.status || 500).json({
    success: false,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
      code: err.code,
      status: err.status
    },
    request: {
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    }
  });
};

// Production error handler (minimal)
export const productionErrorHandler = (err, req, res, next) => {
  // Log error for monitoring
  console.error('Production Error:', {
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const status = err.status || 500;
  const message = status < 500 ? err.message : 'Something went wrong!';

  return fail(res, message, status);
};

export default {
  notFound,
  errorHandler,
  asyncHandler,
  validationErrorHandler,
  developmentErrorHandler,
  productionErrorHandler
};