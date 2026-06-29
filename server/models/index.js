const mongoose = require('mongoose');

// ── Income ───────────────────────────────────────────────────
const incomeSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:    { type: String, required: true },
  amount:   { type: Number, required: true },
  category: { type: String, default: 'Salary' },
  date:     { type: Date, default: Date.now },
  note:     { type: String, default: '' },
}, { timestamps: true });

// ── Budget ───────────────────────────────────────────────────
const budgetSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month:    { type: Number, required: true },   // 1–12
  year:     { type: Number, required: true },
  total:    { type: Number, default: 0 },
  categories: [{
    name:   { type: String, required: true },
    limit:  { type: Number, required: true },
    spent:  { type: Number, default: 0 },
  }],
}, { timestamps: true });

// ── Savings Goal ─────────────────────────────────────────────
const goalSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  targetAmount:{ type: Number, required: true },
  savedAmount: { type: Number, default: 0 },
  deadline:    { type: Date },
  icon:        { type: String, default: '🎯' },
  status:      { type: String, enum: ['active','completed','paused'], default: 'active' },
}, { timestamps: true });

// ── Recurring Expense ─────────────────────────────────────────
const recurringSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:     { type: String, required: true },
  amount:    { type: Number, required: true },
  category:  { type: String, default: 'Subscriptions' },
  frequency: { type: String, enum: ['daily','weekly','monthly','yearly'], default: 'monthly' },
  nextDue:   { type: Date, required: true },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

// ── Notification ──────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type:    { type: String, enum: ['warning','info','success','alert'], default: 'info' },
  read:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  Income:       mongoose.model('Income', incomeSchema),
  Budget:       mongoose.model('Budget', budgetSchema),
  Goal:         mongoose.model('Goal', goalSchema),
  Recurring:    mongoose.model('Recurring', recurringSchema),
  Notification: mongoose.model('Notification', notificationSchema),
};
