const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const { Budget } = require('../models/index');
const { createNotification } = require('../services/notificationService');
const User = require('../models/User');
const { expenseRules } = require('../middleware/validator');

// Helper to check and alert if budget limits are exceeded
async function checkBudgetExceeded(expense) {
  try {
    const expenseDate = expense.date ? new Date(expense.date) : new Date();
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();

    const budget = await Budget.findOne({ user: expense.user, month, year });
    if (!budget) return;

    const user = await User.findById(expense.user);
    const userCurrency = user?.currency || '₹';

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Check Category Budget
    if (expense.category) {
      const catBudget = budget.categories.find(
        c => c.name.toLowerCase() === expense.category.toLowerCase()
      );
      if (catBudget) {
        const categoryTotalGroup = await Expense.aggregate([
          { $match: { user: expense.user, category: expense.category, date: { $gte: startOfMonth, $lte: endOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const categoryTotal = categoryTotalGroup[0]?.total || 0;

        if (categoryTotal > catBudget.limit) {
          await createNotification(
            expense.user,
            'Warning: Category Budget Exceeded ⚠️',
            `You've spent ${userCurrency}${categoryTotal.toFixed(2)} on "${expense.category}" this month, exceeding your budget of ${userCurrency}${catBudget.limit.toFixed(2)}.`,
            'warning'
          );
        }
      }
    }

    // 2. Check Total Budget
    if (budget.total > 0) {
      const totalSpentGroup = await Expense.aggregate([
        { $match: { user: expense.user, date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalSpent = totalSpentGroup[0]?.total || 0;

      if (totalSpent > budget.total) {
        await createNotification(
          expense.user,
          'Warning: Monthly Budget Exceeded ⚠️',
          `Your total monthly spending has reached ${userCurrency}${totalSpent.toFixed(2)}, exceeding your total budget limit of ${userCurrency}${budget.total.toFixed(2)}.`,
          'warning'
        );
      }
    }
  } catch (err) {
    console.error('Error in checkBudgetExceeded:', err);
  }
}

// GET /api/expenses
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, startDate, endDate, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user._id };
    if (category && category !== 'All') filter.category = category;
    if (search) filter.title = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(parseInt(limit)),
      Expense.countDocuments(filter),
    ]);
    res.json({ success: true, data: expenses, total, page: parseInt(page) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/expenses
router.post('/', auth, expenseRules, async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, user: req.user._id });
    checkBudgetExceeded(expense);
    res.status(201).json({ success: true, data: expense });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// PUT /api/expenses/:id
router.put('/:id', auth, expenseRules, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true }
    );
    if (!expense) return res.status(404).json({ success: false, message: 'Not found' });
    checkBudgetExceeded(expense);
    res.json({ success: true, data: expense });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!expense) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/expenses/summary – analytics aggregation
router.get('/summary', auth, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const userId = req.user._id;

    const [byCategory, byMonth, recentTotal] = await Promise.all([
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        { $match: { user: userId, date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
        { $group: { _id: { month: { $month: '$date' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id.month': 1 } },
      ]),
      Expense.aggregate([
        { $match: { user: userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({ success: true, data: { byCategory, byMonth, grandTotal: recentTotal[0]?.total || 0 } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
