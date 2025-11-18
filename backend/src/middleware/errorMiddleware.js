import { fail } from '../utils/response.js';

// Handle 404 Not Found errors
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  // Determine status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle Mongoose bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Log error
  console.error(`[${new Date().toISOString()}] Error: ${message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Send response
  if (process.env.NODE_ENV === 'production') {
    // Use your existing fail utility if possible, or fallback to json
    if (typeof fail === 'function') {
       return fail(res, message || 'Server Error', statusCode);
    }
    return res.status(statusCode).json({
      success: false,
      message: message || 'Server Error'
    });
  } else {
    return res.status(statusCode).json({
      success: false,
      message: message,
      stack: err.stack,
    });
  }
};