const { body, validationResult } = require('express-validator');

// Validation error handler
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// User registration validation
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  validate
];

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

// Transaction validation
const transactionValidation = [
  body('type')
    .notEmpty().withMessage('Transaction type is required')
    .isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('category')
    .notEmpty().withMessage('Category is required'),
  body('date')
    .optional()
    .isISO8601().withMessage('Please provide a valid date'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  validate
];

// Budget validation
const budgetValidation = [
  body('category')
    .notEmpty().withMessage('Category is required'),
  body('limit')
    .notEmpty().withMessage('Budget limit is required')
    .isFloat({ min: 0 }).withMessage('Limit must be a positive number'),
  body('period')
    .optional()
    .isIn(['weekly', 'monthly', 'yearly']).withMessage('Invalid period'),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  transactionValidation,
  budgetValidation
};
