import { body, param, query, validationResult } from 'express-validator';

// Common validation rules
export const commonValidations = {
  // MongoDB ObjectId validation
  mongoId: (field = 'id') => 
    param(field).isMongoId().withMessage(`Invalid ${field} format`),
  
  // Email validation
  email: (field = 'email') =>
    body(field)
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  
  // Password validation
  password: (field = 'password') =>
    body(field)
      .isLength({ min: 6, max: 128 })
      .withMessage('Password must be between 6 and 128 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  // Name validation
  name: (field = 'name') =>
    body(field)
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
  
  // --- THIS IS THE FIX ---
  // Replaced isMobilePhone() with a more flexible regex
  phone: (field = 'phone') =>
    body(field)
      .optional({ checkFalsy: true }) // Allow empty strings
      .matches(/^\+[1-9]\d{1,14}$/) // E.164 format (e.g., +123456789)
      .withMessage('Phone number must be in international format (e.g., +1234567891)'),
  // --- END OF FIX ---

  // URL validation
  url: (field) =>
    body(field)
      .optional()
      .isURL()
      .withMessage(`${field} must be a valid URL`),
  
  // Pagination validation
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt()
  ]
};

// User validation rules
export const userValidations = {
  register: [
    commonValidations.name(),
    commonValidations.email(),
    commonValidations.password(),
    body('role')
      .optional()
      .isIn(['donor', 'recipient'])
      .withMessage('Role must be either donor or recipient'),
    body('location.address')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    body('organization.name')
      .if(body('role').equals('recipient')) // Only validate if role is 'recipient'
      .notEmpty()
      .withMessage('Organization name is required for recipients')
      .trim()
      .isLength({ max: 100 })
      .withMessage('Organization name cannot exceed 100 characters'),
      body('organization.type')
      .optional({ checkFalsy: true })
      .isIn(['NGO', 'Charity', 'Community Group', 'School', 'Other'])
      .withMessage('Invalid organization type'),
    
    body('organization.registrationNumber')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 50 })
      .withMessage('Registration number cannot exceed 50 characters'),
      
    body('organization.website')
      .optional({ checkFalsy: true })
      .isURL()
      .withMessage('Please provide a valid website URL (e.g., https://example.com)'),
  ],
  
  login: [
    commonValidations.email(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  
  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s]+$/) // Allow spaces in name
      .withMessage('Name can only contain letters and spaces'),
    
    body('profile')
      .optional()
      .isObject()
      .withMessage('Profile must be an object'),
    body('profile.bio')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Bio cannot exceed 500 characters'),
    
    body('contact')
      .optional()
      .isObject()
      .withMessage('Contact must be an object'),
    commonValidations.phone('contact.phone'), // This now uses the new, flexible rule
    
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object'),
    body('location.address')
      .optional({ checkFalsy: true }) // allow empty string
      .trim()
      .isLength({ max: 200 })
      .withMessage('Address cannot exceed 200 characters'),
    body('location.city')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('City cannot exceed 100 characters'),
    body('location.state')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ max: 100 })
      .withMessage('State cannot exceed 100 characters'),
    
    body('organization')
      .optional()
      .isObject()
      .withMessage('Organization must be an object'),
    body('organization.name')
      .optional({ checkFalsy: true }) // Allow empty string
      .trim()
      .isLength({ max: 100 })
      .withMessage('Organization name cannot exceed 100 characters')
  ],
  
  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password('newPassword')
  ]
};


// Donation validation rules
export const donationValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 5, max: 1000 }) // Min length is 5
      .withMessage('Description must be between 5 and 1000 characters'),
    body('category')
      .isIn(['outerwear', 'formal', 'casual', 'children', 'accessories', 'shoes', 'activewear', 'undergarments', 'traditional', 'seasonal', 'maternity', 'plus-size', 'household', 'linens', 'other'])
      .withMessage('Invalid category'),
    body('subcategory')
      .trim()
      .notEmpty()
      .withMessage('Sub-category is required')
      .isLength({ max: 100 })
      .withMessage('Sub-category cannot exceed 100 characters'),
    body('condition')
      .isIn(['excellent', 'good', 'fair', 'poor'])
      .withMessage('Invalid condition'),
    body('quantity')
      .isInt({ min: 1, max: 10000 })
      .withMessage('Quantity must be between 1 and 10000'),
    body('sizes')
      .isArray({ min: 1 })
      .withMessage('At least one size must be provided'),
    body('sizes.*.size')
      .trim()
      .notEmpty()
      .withMessage('Size cannot be empty'),
    body('sizes.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Size quantity must be at least 1'),
    body('location')
      .isObject()
      .withMessage('Location object is required')
      .custom(value => {
         if (!value.address || !value.city || !value.state || !value.country) {
           throw new Error('Location object must contain address, city, state, and country');
         }
         return true;
      }),
    body('colors')
      .optional()
      .isArray()
      .withMessage('Colors must be an array'),
    body('availability')
      .optional()
      .isObject()
      .withMessage('Availability must be an object'),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],
  
  update: [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('quantity')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Quantity must be between 1 and 1000')
  ]
};

// Request validation rules
export const requestValidations = {
  create: [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('Title must be between 5 and 200 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    body('category')
      .optional()
      .isIn(['outerwear', 'formal', 'casual', 'children', 'accessories', 'shoes', 'activewear', 'undergarments', 'traditional', 'seasonal', 'maternity', 'plus-size', 'household', 'linens', 'other']) // <-- THE FIX IS HERE
      .withMessage('Invalid category'),
    body('urgency')
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Invalid urgency level'),
    body('quantity')
      .isInt({ min: 1, max: 1000 })
      .withMessage('Quantity must be between 1 and 1000'),
    body('beneficiaries.count')
      .isInt({ min: 1 })
      .withMessage('Beneficiary count must be at least 1'),
    body('timeline.neededBy')
      .isISO8601()
      .withMessage('Invalid needed by date')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Needed by date must be in the future');
        }
        return true;
      }),
    body('location.address')
      .trim()
      .notEmpty()
      .withMessage('Address is required'),
    body('location.city')
      .trim()
      .notEmpty()
      .withMessage('City is required')
  ]
};

// Admin validation rules
export const adminValidations = {
  moderateDonation: [
    commonValidations.mongoId('donationId'),
    body('action')
      .isIn(['approve', 'reject'])
      .withMessage('Action must be either approve or reject'),
    body('reason')
      .if(body('action').equals('reject'))
      .trim()
      .notEmpty()
      .withMessage('Rejection reason is required'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ],
  
  updateUserStatus: [
    commonValidations.mongoId('userId'),
    body('status')
      .isIn(['active', 'inactive', 'suspended', 'banned'])
      .withMessage('Invalid status'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Reason cannot exceed 200 characters')
  ]
};

// Search and filter validations
export const searchValidations = {
  donations: [
    query('category')
      .optional()
      .isIn(['outerwear', 'formal', 'casual', 'children', 'accessories', 'shoes', 'activewear', 'undergarments', 'traditional', 'seasonal', 'maternity', 'plus-size'])
      .withMessage('Invalid category'),
    query('condition')
      .optional()
      .isIn(['excellent', 'good', 'fair', 'poor'])
      .withMessage('Invalid condition'),
    query('location')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Location must be between 2 and 100 characters'),
    query('radius')
      .optional()
      .isFloat({ min: 1, max: 100 })
      .withMessage('Radius must be between 1 and 100 km'),
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'quantity', 'distance', 'relevance'])
      .withMessage('Invalid sort field'),
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc'),
    ...commonValidations.pagination
  ]
};

// Validation result handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

// Custom validators
export const customValidators = {
  coordinates: (value) => {
    if (!Array.isArray(value) || value.length !== 2) {
      throw new Error('Coordinates must be an array of [longitude, latitude]');
    }
    const [lng, lat] = value;
    if (typeof lng !== 'number' || typeof lat !== 'number') {
      throw new Error('Invalid coordinate values');
    }
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      throw new Error('Invalid coordinate values');
    }
    return true;
  },
  futureDate: (value) => {
    if (new Date(value) <= new Date()) {
      throw new Error('Date must be in the future');
    }
    return true;
  },
  uniqueArray: (value) => {
    if (new Set(value).size !== value.length) {
      throw new Error('Array values must be unique');
    }
    return true;
  }
};

export default {
  commonValidations,
  userValidations,
  donationValidations,
  requestValidations,
  adminValidations,
  searchValidations,
  handleValidationErrors,
  customValidators
};