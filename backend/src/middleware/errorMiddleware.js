import { fail } from '../utils/response.js';

// Handle 404 Not Found errors
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global error handler
export const errorHandler = (err, req, res, next) => {
  // Determine status code - if it's 200, change it to 500
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // --- 💡 IMPROVEMENT: Handle specific Mongoose errors cleanly ---
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found.';
  }

  // Log the detailed error for the developer in any environment
  console.error('--- Backend Error Log ---');
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('-------------------------');
  
  // --- 💡 IMPROVEMENT: Send a different response based on the environment ---
  if (process.env.NODE_ENV === 'production') {
    // In production, send a generic, user-friendly message.
    // Do NOT send the technical error stack.
    return fail(res, 'An unexpected server error occurred.', statusCode);
  } else {
    // In development, send the full technical error for easier debugging.
    return res.status(statusCode).json({
      success: false,
      message: message,
      stack: err.stack, // Send the stack trace only in development
    });
  }
};
