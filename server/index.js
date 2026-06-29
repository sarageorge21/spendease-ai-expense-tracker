const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' });
app.use('/api/', limiter);

// ── Middleware ───────────────────────────────────────────────
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173'];
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/expenses',   require('./routes/expenses'));
app.use('/api/income',     require('./routes/income'));
app.use('/api/budgets',    require('./routes/budgets'));
app.use('/api/goals',      require('./routes/goals'));
app.use('/api/recurring',  require('./routes/recurring'));
app.use('/api/ocr',        require('./routes/ocr'));
app.use('/api/ai',         require('./routes/ai'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Serve Frontend in Production ─────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// ── Error Handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

const { initRecurringAutomator } = require('./jobs/recurringAutomator');

// ── DB + Server ──────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      initRecurringAutomator();
    });
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });
