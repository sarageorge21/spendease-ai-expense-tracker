const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const { Income } = require('../models/index');

// GET /api/reports/export?format=csv&month=6&year=2026
router.get('/export', auth, async (req, res) => {
  try {
    const { format = 'csv', month, year = new Date().getFullYear() } = req.query;
    const filter = { user: req.user._id };
    if (month) {
      const start = new Date(year, parseInt(month) - 1, 1);
      const end   = new Date(year, parseInt(month), 0);
      filter.date = { $gte: start, $lte: end };
    } else {
      filter.date = { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) };
    }

    const [expenses, income] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }),
      Income.find({ user: req.user._id }).sort({ date: -1 }),
    ]);

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome   = income.reduce((s, i) => s + i.amount, 0);
    const savings       = totalIncome - totalExpenses;

    if (format === 'csv') {
      const header = 'Date,Title,Category,Amount,Type,Note\n';
      const expRows = expenses.map(e =>
        `${new Date(e.date).toLocaleDateString()},${e.title},${e.category},${e.amount},Expense,${e.note || ''}`
      ).join('\n');
      const incRows = income.map(i =>
        `${new Date(i.date).toLocaleDateString()},${i.title},${i.category},${i.amount},Income,${i.note || ''}`
      ).join('\n');
      const summary = `\n\nSUMMARY\nTotal Income,${totalIncome}\nTotal Expenses,${totalExpenses}\nNet Savings,${savings}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=spendease_report_${year}.csv`);
      return res.send(header + expRows + '\n' + incRows + summary);
    }

    // JSON report
    const catBreakdown = {};
    expenses.forEach(e => { catBreakdown[e.category] = (catBreakdown[e.category] || 0) + e.amount; });

    res.json({
      success: true,
      data: {
        period: month ? `${month}/${year}` : `${year}`,
        totalExpenses, totalIncome, savings,
        savingsRate: totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : 0,
        expenseCount: expenses.length,
        categoryBreakdown: catBreakdown,
        expenses: expenses.slice(0, 50),
        income,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
