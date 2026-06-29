const { body, validationResult } = require('express-validator');

/**
 * Middleware to check validation results.
 * Returns 400 Bad Request with errors array if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const profileRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('currency').optional().trim().notEmpty().withMessage('Currency symbol cannot be empty'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

const expenseRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('date').optional().isISO8601().withMessage('Please provide a valid ISO date'),
  body('note').optional().trim(),
  body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
  body('isRecurring').optional().isBoolean().withMessage('isRecurring must be a boolean'),
  validate
];

const incomeRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),
  body('category').optional().trim().notEmpty().withMessage('Category cannot be empty'),
  body('date').optional().isISO8601().withMessage('Please provide a valid ISO date'),
  body('note').optional().trim(),
  validate
];

const budgetRules = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100'),
  body('total').optional().isFloat({ min: 0 }).withMessage('Total limit must be a positive number'),
  body('categories').optional().isArray().withMessage('Categories must be an array'),
  body('categories.*.name').trim().notEmpty().withMessage('Category name is required'),
  body('categories.*.limit').isFloat({ min: 0 }).withMessage('Category limit must be a positive number'),
  validate
];

const goalRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('targetAmount').isFloat({ min: 0.01 }).withMessage('Target amount must be a positive number greater than 0'),
  body('savedAmount').optional().isFloat({ min: 0 }).withMessage('Saved amount must be a non-negative number'),
  body('deadline').optional().isISO8601().withMessage('Please provide a valid ISO date for deadline'),
  body('icon').optional().trim(),
  body('status').optional().isIn(['active', 'completed', 'paused']).withMessage('Status must be active, completed, or paused'),
  validate
];

const goalUpdateRules = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('targetAmount').optional().isFloat({ min: 0.01 }).withMessage('Target amount must be a positive number greater than 0'),
  body('savedAmount').optional().isFloat({ min: 0 }).withMessage('Saved amount must be a non-negative number'),
  body('deadline').optional().isISO8601().withMessage('Please provide a valid ISO date for deadline'),
  body('icon').optional().trim(),
  body('status').optional().isIn(['active', 'completed', 'paused']).withMessage('Status must be active, completed, or paused'),
  validate
];

const recurringRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number greater than 0'),
  body('category').optional().trim(),
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Frequency must be daily, weekly, monthly, or yearly'),
  body('nextDue').isISO8601().withMessage('Please provide a valid ISO date for next due date'),
  validate
];

module.exports = {
  registerRules,
  loginRules,
  profileRules,
  expenseRules,
  incomeRules,
  budgetRules,
  goalRules,
  goalUpdateRules,
  recurringRules
};
