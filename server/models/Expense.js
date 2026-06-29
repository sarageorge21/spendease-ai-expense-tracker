const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  amount:      { type: Number, required: true, min: 0.01 },
  category:    { type: String, default: 'Uncategorized' },
  date:        { type: Date, default: Date.now },
  note:        { type: String, default: '' },
  tags:        { type: [String], default: [] },
  isRecurring: { type: Boolean, default: false },
  receiptUrl:  { type: String, default: '' },
  aiSuggested: { type: Boolean, default: false },
  source:      { type: String, enum: ['manual', 'ocr', 'recurring'], default: 'manual' },
}, { timestamps: true });

expenseSchema.index({ user: 1, date: -1 });
expenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
