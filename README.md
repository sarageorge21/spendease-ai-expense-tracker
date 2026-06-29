# 💸 Spendease Pro – AI Personal Finance & Expense Intelligence Platform

A production-grade MERN SaaS fintech application with AI insights, OCR receipt scanning, budgeting, savings goals, predictions, and analytics.

---

## 🗂 Project Structure

```
spendease-pro/
├── client/                          # React (Vite) Frontend
│   └── src/
│       ├── api/                     # Axios API modules
│       │   ├── client.js            # Axios instance + interceptors
│       │   └── index.js             # All API endpoints
│       ├── components/
│       │   └── common/
│       │       ├── Sidebar.jsx      # Navigation sidebar
│       │       ├── StatCard.jsx     # Reusable stat card
│       │       └── Modal.jsx        # Reusable modal
│       ├── context/
│       │   └── AuthContext.jsx      # JWT auth context
│       ├── pages/
│       │   ├── Landing.jsx          # Public marketing page
│       │   ├── Auth.jsx             # Login + Register
│       │   ├── Dashboard.jsx        # Core expense tracker
│       │   ├── Analytics.jsx        # Charts & insights
│       │   ├── AIAssistant.jsx      # Chatbot + predictions
│       │   └── OtherPages.jsx       # Budgets, Goals, Recurring, Reports
│       ├── utils/index.js           # Formatters, constants
│       ├── App.jsx                  # Router + layout
│       └── index.css                # Design system CSS
│
└── server/                          # Node.js + Express Backend
    ├── models/
    │   ├── User.js                  # User schema + bcrypt
    │   ├── Expense.js               # Expense schema
    │   └── index.js                 # Income, Budget, Goal, Recurring, Notification
    ├── routes/
    │   ├── auth.js                  # JWT login/register/me
    │   ├── expenses.js              # CRUD + aggregation
    │   ├── _combined.js             # Income, Budget, Goal, Recurring, Notification
    │   ├── ai.js                    # Insights, chatbot, predictions
    │   ├── ocr.js                   # Tesseract.js receipt scanning
    │   └── reports.js               # CSV/JSON export
    ├── middleware/
    │   └── auth.js                  # JWT middleware
    └── index.js                     # Express server entry
```

---

## 🚀 Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Marketing page with features, stats, CTA |
| Login | `/login` | JWT authentication |
| Register | `/register` | Account creation |
| Dashboard | `/dashboard` | Add/edit/delete expenses, income, OCR scan |
| Analytics | `/analytics` | Bar, line, doughnut charts by month/category |
| AI Assistant | `/ai` | Chatbot, health score, alerts, predictions |
| Budgets | `/budgets` | Monthly + category budget with progress bars |
| Goals | `/goals` | Savings goal cards with progress tracking |
| Recurring | `/recurring` | Subscription management with due-date alerts |
| Reports | `/reports` | Summary stats + CSV export |

---

## ⚙️ Setup

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

---

### 1. Clone / Extract
```bash
cd spendease-pro
```

### 2. Backend
```bash
cd server
npm install
copy .env.example .env   # Windows
# OR
cp .env.example .env     # Mac/Linux

# Edit .env and set your MONGO_URI
npm run dev
# Server: http://localhost:5000
```

### 3. Frontend
```bash
cd client
npm install
npm run dev
# App: http://localhost:3000
```

---

## 🔑 Environment Variables (server/.env)

```
PORT=5000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/spendease-pro
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

---

## 🌐 API Reference

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Create account | ❌ |
| POST | /api/auth/login | Get JWT token | ❌ |
| GET | /api/auth/me | Current user | ✅ |
| GET | /api/expenses | List expenses (filter/search/paginate) | ✅ |
| POST | /api/expenses | Create expense | ✅ |
| PUT | /api/expenses/:id | Update expense | ✅ |
| DELETE | /api/expenses/:id | Delete expense | ✅ |
| GET | /api/expenses/summary | Aggregated analytics | ✅ |
| GET | /api/income | List income | ✅ |
| POST | /api/income | Add income | ✅ |
| GET | /api/budgets | Get monthly budget | ✅ |
| POST | /api/budgets | Save budget | ✅ |
| GET | /api/goals | List savings goals | ✅ |
| POST | /api/goals | Create goal | ✅ |
| PUT | /api/goals/:id | Update goal progress | ✅ |
| GET | /api/recurring | List recurring expenses | ✅ |
| POST | /api/recurring | Add recurring | ✅ |
| POST | /api/ocr/scan | Scan receipt image | ✅ |
| GET | /api/ai/insights | AI financial analysis | ✅ |
| POST | /api/ai/chat | Chatbot response | ✅ |
| GET | /api/ai/predictions | 3-month forecast | ✅ |
| GET | /api/reports/export | CSV or JSON report | ✅ |

---

## 🤖 AI Features (Current)

All AI runs on rule-based logic locally — no external API needed:

- **Financial Health Score (0–100)** based on savings rate and spending trends
- **Spending Personality** classification (Smart Saver, Overspender, Foodie, etc.)
- **Chatbot** answers questions about spending, income, savings, categories
- **3-Month Predictions** from moving averages of historical data
- **Overspending Alerts** generated from budget vs actual comparison
- **Personalized Suggestions** based on savings rate, trend, and top category
- **OCR Receipt Parsing** — extracts title, amount, date, category from images

---

## 🔌 Future AI Upgrades (Plug-in Ready)

The codebase is structured to drop in LLM APIs:

### OpenAI / Claude Integration
In `server/routes/ai.js`, replace `generateChatReply()` with:
```js
const { OpenAI } = require('openai');
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: `User financial data: ${JSON.stringify(financialContext)}` },
    { role: 'user', content: message }
  ]
});
return completion.choices[0].message.content;
```

### AI Auto-Categorisation
In `server/routes/ocr.js`, after Tesseract extraction, send text to an NLP endpoint to get a smarter category.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Charts | Chart.js + react-chartjs-2 |
| HTTP | Axios (with interceptors) |
| Backend | Node.js, Express 4 |
| Auth | JWT + bcryptjs |
| Database | MongoDB + Mongoose |
| OCR | Tesseract.js |
| Rate Limiting | express-rate-limit |
| Styling | CSS Variables design system |

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| MongoDB ECONNREFUSED | Start mongod or update MONGO_URI in .env |
| JWT errors | Make sure JWT_SECRET is set in .env |
| OCR not working | Check uploads/ folder exists; image must be <5MB |
| Charts blank | Ensure expenses exist for the selected year |
| CORS errors | Make sure server is on port 5000 and client on 3000 |
