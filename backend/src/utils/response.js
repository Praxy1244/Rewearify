// Success response helper
export const ok = (res, data = null, message = 'Success', status = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(status).json(response);
};

// Error response helper
export const fail = (res, message = 'Error', status = 400, data = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  // Add error code for client handling
  response.errorCode = getErrorCode(status);

  return res.status(status).json(response);
};

// Paginated response helper
export const paginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

// Created response helper
export const created = (res, data = null, message = 'Created successfully') => {
  return ok(res, data, message, 201);
};

// No content response helper
export const noContent = (res, message = 'No content') => {
  return res.status(204).json({
    success: true,
    message,
    timestamp: new Date().toISOString()
  });
};

// Unauthorized response helper
export const unauthorized = (res, message = 'Unauthorized access') => {
  return fail(res, message, 401);
};

// Forbidden response helper
export const forbidden = (res, message = 'Access forbidden') => {
  return fail(res, message, 403);
};

// Not found response helper
export const notFound = (res, message = 'Resource not found') => {
  return fail(res, message, 404);
};

// Conflict response helper
export const conflict = (res, message = 'Resource conflict') => {
  return fail(res, message, 409);
};

// Validation error response helper
export const validationError = (res, errors, message = 'Validation failed') => {
  return fail(res, message, 422, { errors });
};

// Server error response helper
export const serverError = (res, message = 'Internal server error') => {
  return fail(res, message, 500);
};

// Get error code based on status
const getErrorCode = (status) => {
  const errorCodes = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE'
  };
  
  return errorCodes[status] || 'UNKNOWN_ERROR';
};

// API response wrapper for async functions
export const asyncResponse = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error('Async response error:', error);
      next(error);
    }
  };
};

// Cache response helper
export const cached = (res, data, cacheTime = 300, message = 'Success') => {
  res.set('Cache-Control', `public, max-age=${cacheTime}`);
  return ok(res, data, message);
};

export default {
  ok,
  fail,
  paginated,
  created,
  noContent,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  validationError,
  serverError,
  asyncResponse,
  cached
};