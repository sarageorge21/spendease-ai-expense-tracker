const express = require('express');
const auth = require('../middleware/auth');
const { Income, Budget, Goal, Recurring, Notification } = require('../models/index');
const { incomeRules, budgetRules, goalRules, goalUpdateRules, recurringRules } = require('../middleware/validator');

// ── Income Router ─────────────────────────────────────────────
const incomeRouter = express.Router();
incomeRouter.get('/', auth, async (req, res) => {
  try {
    const income = await Income.find({ user: req.user._id }).sort({ date: -1 });
    const total = income.reduce((s, i) => s + i.amount, 0);
    res.json({ success: true, data: income, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
incomeRouter.post('/', auth, incomeRules, async (req, res) => {
  try {
    const item = await Income.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
incomeRouter.delete('/:id', auth, async (req, res) => {
  try {
    await Income.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Budget Router ─────────────────────────────────────────────
const budgetRouter = express.Router();
budgetRouter.get('/', auth, async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    let budget = await Budget.findOne({ user: req.user._id, month: parseInt(month), year: parseInt(year) });
    if (!budget) budget = { categories: [], total: 0 };
    res.json({ success: true, data: budget });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
budgetRouter.post('/', auth, budgetRules, async (req, res) => {
  try {
    const { month, year, total, categories } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month, year },
      { total, categories },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: budget });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Goals Router ──────────────────────────────────────────────
const goalRouter = express.Router();
goalRouter.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: goals });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
goalRouter.post('/', auth, goalRules, async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: goal });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
goalRouter.put('/:id', auth, goalUpdateRules, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id }, req.body, { new: true }
    );
    res.json({ success: true, data: goal });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
goalRouter.delete('/:id', auth, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Recurring Router ──────────────────────────────────────────
const recurringRouter = express.Router();
recurringRouter.get('/', auth, async (req, res) => {
  try {
    const items = await Recurring.find({ user: req.user._id, isActive: true }).sort({ nextDue: 1 });
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
recurringRouter.post('/', auth, recurringRules, async (req, res) => {
  try {
    const item = await Recurring.create({ ...req.body, user: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});
recurringRouter.delete('/:id', auth, async (req, res) => {
  try {
    await Recurring.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Notifications Router ──────────────────────────────────────
const notifRouter = express.Router();
notifRouter.get('/', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: notifs });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
notifRouter.put('/:id/read', auth, async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
notifRouter.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = { incomeRouter, budgetRouter, goalRouter, recurringRouter, notifRouter };
