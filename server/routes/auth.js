const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createNotification } = require('../services/notificationService');
const { registerRules, loginRules, profileRules } = require('../middleware/validator');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post('/register', registerRules, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    // Welcome Notification
    await createNotification(
      user._id,
      'Welcome to Spendease Pro! 🎉',
      `Hi ${name}, welcome! Start by tracking your first expense or setting a monthly budget.`,
      'success'
    );

    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, currency: user.currency } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', loginRules, async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, currency: user.currency, financialHealthScore: user.financialHealthScore } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', auth, profileRules, async (req, res) => {
  try {
    const { name, currency, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (currency) user.currency = currency;
    if (password) {
      user.password = password;
    }

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ success: true, user: userResponse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
