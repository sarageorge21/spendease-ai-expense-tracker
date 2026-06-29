const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const { Income, Budget, Goal, Recurring } = require('../models/index');
const User = require('../models/User');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const isOpenAIConfigured = process.env.OPENAI_API_KEY && 
                            process.env.OPENAI_API_KEY !== 'your_openai_key_here' && 
                            process.env.OPENAI_API_KEY.trim() !== '';

const isGeminiConfigured = process.env.GEMINI_API_KEY && 
                            process.env.GEMINI_API_KEY !== 'your_gemini_key_here' && 
                            process.env.GEMINI_API_KEY.trim() !== '';

let openai = null;
let geminiModel = null;
let activeProvider = null;

if (isGeminiConfigured) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  activeProvider = 'gemini';
  console.log('🤖 Google Gemini AI service initialized.');
} else if (isOpenAIConfigured) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  activeProvider = 'openai';
  console.log('🤖 OpenAI AI service initialized.');
} else {
  console.warn('⚠️ No AI API keys configured or placeholders found. Running SpendEase Pro in fallback rule-based mode.');
}

// ── GET /api/ai/insights ──────────────────────────────────────
router.get('/insights', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthExp, lastMonthExp, allExp, incomeData] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: startOfMonth } }),
      Expense.find({ user: userId, date: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
      Expense.find({ user: userId }),
      Income.find({ user: userId, date: { $gte: startOfMonth } }),
    ]);

    const thisTotal  = thisMonthExp.reduce((s, e) => s + e.amount, 0);
    const lastTotal  = lastMonthExp.reduce((s, e) => s + e.amount, 0);
    const incomeTotal = incomeData.reduce((s, i) => s + i.amount, 0);
    const savings = incomeTotal - thisTotal;
    const savingsRate = incomeTotal > 0 ? ((savings / incomeTotal) * 100).toFixed(1) : 0;

    // Category breakdown this month
    const catMap = {};
    thisMonthExp.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
    const topCategory = Object.entries(catMap).sort((a,b) => b[1]-a[1])[0];

    // Spending trend
    const trend = thisTotal > lastTotal ? 'up' : thisTotal < lastTotal ? 'down' : 'stable';
    const trendPct = lastTotal > 0 ? Math.abs(((thisTotal - lastTotal) / lastTotal) * 100).toFixed(1) : 0;

    // Health score (0–100)
    let healthScore = 50;
    if (savingsRate >= 20) healthScore += 20;
    else if (savingsRate >= 10) healthScore += 10;
    if (trend === 'down') healthScore += 15;
    else if (trend === 'up') healthScore -= 10;
    if (thisTotal === 0 && incomeTotal === 0) healthScore = 50;
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Spending personality
    let personality = 'Balanced Spender';
    let riskScore = 50;
    if (savingsRate >= 30) { personality = 'Smart Saver 🧠'; riskScore = 20; }
    else if (savingsRate >= 15) { personality = 'Mindful Spender 💡'; riskScore = 35; }
    else if (savingsRate < 0) { personality = 'Overspender ⚠️'; riskScore = 85; }
    else if (topCategory && topCategory[0] === 'Food') { personality = 'Foodie Spender 🍔'; riskScore = 55; }
    else if (topCategory && topCategory[0] === 'Entertainment') { personality = 'Experience Seeker 🎬'; riskScore = 60; }

    // Update user scores
    await User.findByIdAndUpdate(userId, { financialHealthScore: healthScore, spendingPersonality: personality, riskScore });

    // Baseline Alerts
    let alerts = [];
    if (savings < 0) {
      alerts.push({ type: 'warning', message: `You've overspent by ${req.user.currency || '₹'}${Math.abs(savings).toFixed(2)} this month` });
    }
    if (trendPct > 20 && trend === 'up') {
      alerts.push({ type: 'alert', message: `Spending is up ${trendPct}% vs last month` });
    }
    if (savingsRate >= 20) {
      alerts.push({ type: 'success', message: `Great job! You're saving ${savingsRate}% of income` });
    }

    let suggestions = [];

    // Attempt real AI insights generation
    if (activeProvider === 'openai' && openai) {
      try {
        const prompt = `You are a financial advisor analyzing a user's monthly spending.
Here is the user's data for this month:
- Name: ${req.user.name}
- Currency Symbol: ${req.user.currency || '₹'}
- Total Income: ${req.user.currency || '₹'}${incomeTotal}
- Total Spending: ${req.user.currency || '₹'}${thisTotal}
- Last Month's Spending: ${req.user.currency || '₹'}${lastTotal}
- Savings: ${req.user.currency || '₹'}${savings} (Savings Rate: ${savingsRate}%)
- Spending Trend: ${trend} (${trendPct}% change vs last month)
- Top Category: ${topCategory ? `${topCategory[0]} at ${req.user.currency || '₹'}${topCategory[1]}` : 'None'}
- Category Breakdown: ${JSON.stringify(catMap)}
- Current Health Score: ${healthScore}/100
- Assigned Spending Personality: ${personality}

Based on this, generate:
1. Up to 3 personalized notifications/alerts (can be warnings, alerts, successes, or info). Keep each alert message under 80 characters.
2. A list of 4 highly actionable, specific, and personalized tips/suggestions to help them save money or optimize their spending based on this exact data. Keep each suggestion under 120 characters.

Return your response in standard JSON format:
{
  "alerts": [
    { "type": "warning" | "alert" | "success" | "info", "message": "alert message" }
  ],
  "suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3",
    "suggestion 4"
  ]
}
Do not include any markdown formatting, backticks, or extra text. Just the JSON object.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const result = JSON.parse(completion.choices[0].message.content);
        if (Array.isArray(result.alerts)) alerts = result.alerts;
        if (Array.isArray(result.suggestions)) suggestions = result.suggestions;
      } catch (err) {
        console.error('OpenAI Insights Error:', err.message);
        suggestions = generateSuggestions({ savingsRate, trend, topCategory, thisTotal, incomeTotal });
      }
    } else if (activeProvider === 'gemini' && geminiModel) {
      try {
        const prompt = `You are a financial advisor analyzing a user's monthly spending.
Here is the user's data for this month:
- Name: ${req.user.name}
- Currency Symbol: ${req.user.currency || '₹'}
- Total Income: ${req.user.currency || '₹'}${incomeTotal}
- Total Spending: ${req.user.currency || '₹'}${thisTotal}
- Last Month's Spending: ${req.user.currency || '₹'}${lastTotal}
- Savings: ${req.user.currency || '₹'}${savings} (Savings Rate: ${savingsRate}%)
- Spending Trend: ${trend} (${trendPct}% change vs last month)
- Top Category: ${topCategory ? `${topCategory[0]} at ${req.user.currency || '₹'}${topCategory[1]}` : 'None'}
- Category Breakdown: ${JSON.stringify(catMap)}
- Current Health Score: ${healthScore}/100
- Assigned Spending Personality: ${personality}

Based on this, generate:
1. Up to 3 personalized notifications/alerts (can be warnings, alerts, successes, or info). Keep each alert message under 80 characters.
2. A list of 4 highly actionable, specific, and personalized tips/suggestions to help them save money or optimize their spending based on this exact data. Keep each suggestion under 120 characters.

Return your response in standard JSON format:
{
  "alerts": [
    { "type": "warning", "message": "alert message" }
  ],
  "suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3",
    "suggestion 4"
  ]
}
Do not include any markdown formatting, backticks, or extra text. Just the JSON object.`;

        const result = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
          }
        });

        const parsedResult = JSON.parse(result.response.text());
        if (Array.isArray(parsedResult.alerts)) alerts = parsedResult.alerts;
        if (Array.isArray(parsedResult.suggestions)) suggestions = parsedResult.suggestions;
      } catch (err) {
        console.error('Gemini Insights Error:', err.message);
        suggestions = generateSuggestions({ savingsRate, trend, topCategory, thisTotal, incomeTotal });
      }
    } else {
      suggestions = generateSuggestions({ savingsRate, trend, topCategory, thisTotal, incomeTotal });
    }

    res.json({
      success: true,
      data: {
        thisMonthTotal: thisTotal,
        lastMonthTotal: lastTotal,
        incomeTotal,
        savings,
        savingsRate: parseFloat(savingsRate),
        trend,
        trendPct: parseFloat(trendPct),
        topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
        healthScore,
        personality,
        riskScore,
        alerts,
        suggestions,
        categoryBreakdown: catMap,
      }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/ai/chat ─────────────────────────────────────────
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required' });

    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [expenses, income, budget, goals, recurring] = await Promise.all([
      Expense.find({ user: userId }).sort({ date: -1 }).limit(50),
      Income.find({ user: userId }),
      Budget.findOne({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      Goal.find({ user: userId }),
      Recurring.find({ user: userId, isActive: true }),
    ]);

    const thisMonthExp = expenses.filter(e => e.date >= startOfMonth);
    const thisTotal = thisMonthExp.reduce((s, e) => s + e.amount, 0);
    const totalIncome = income.reduce((s, i) => s + i.amount, 0);

    // If AI provider is initialized, run LLM with rich user context
    if (activeProvider) {
      try {
        const financialContext = {
          userName: req.user.name,
          currency: req.user.currency || '₹',
          currentDate: now.toDateString(),
          thisMonthSpent: thisTotal,
          totalIncome: totalIncome,
          netSavings: totalIncome - thisTotal,
          recentExpenses: expenses.map(e => ({
            title: e.title,
            amount: e.amount,
            category: e.category,
            date: e.date.toDateString(),
            note: e.note || ''
          })),
          budgetLimit: budget?.total || 0,
          budgetCategoryLimits: budget?.categories || [],
          savingsGoals: goals.map(g => ({
            title: g.title,
            targetAmount: g.targetAmount,
            savedAmount: g.savedAmount,
            deadline: g.deadline ? g.deadline.toDateString() : 'No deadline',
            status: g.status
          })),
          activeSubscriptions: recurring.map(r => ({
            title: r.title,
            amount: r.amount,
            frequency: r.frequency,
            nextDue: r.nextDue.toDateString()
          }))
        };

        const systemPrompt = `You are SpendEase AI, the Personal Finance Assistant for the SpendEase Pro platform.
You are helping the user, ${financialContext.userName}, manage their personal finances.
Here is the user's real-time financial context:
- User Name: ${financialContext.userName}
- Currency Symbol: ${financialContext.currency}
- Current Date: ${financialContext.currentDate}
- Total Monthly Income: ${financialContext.currency}${financialContext.totalIncome}
- Total Spent This Month: ${financialContext.currency}${financialContext.thisMonthSpent}
- Net Savings This Month: ${financialContext.currency}${financialContext.netSavings}
- Monthly Budget Limit: ${financialContext.currency}${financialContext.budgetLimit}
- Budgets by Category: ${JSON.stringify(financialContext.budgetCategoryLimits)}
- Savings Goals: ${JSON.stringify(financialContext.savingsGoals)}
- Active Subscriptions/Recurring Bills: ${JSON.stringify(financialContext.activeSubscriptions)}
- Recent Transactions (Last 50): ${JSON.stringify(financialContext.recentExpenses)}

Guidelines:
1. Provide accurate, helpful, and highly personalized financial advice.
2. Reference their actual data (expenses, budgets, savings goals) directly when answering. E.g., if they ask how much they spent on food, check the transactions or category totals.
3. Be friendly, concise, and professional.
4. Keep response formatting clean and readable using standard Markdown (like bolding and bullet points). Do not use Markdown tables unless necessary.
5. If the user asks about something completely unrelated to finance, personal finance, budgeting, or SpendEase Pro, politely guide them back to finance.`;

        if (activeProvider === 'openai' && openai) {
          const messagesToSend = [{ role: 'system', content: systemPrompt }];
          if (Array.isArray(history)) {
            history.slice(-10).forEach(msg => {
              if (msg.text && msg.role) {
                messagesToSend.push({
                  role: msg.role === 'ai' || msg.role === 'assistant' ? 'assistant' : 'user',
                  content: msg.text
                });
              }
            });
          }
          messagesToSend.push({ role: 'user', content: message });

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messagesToSend,
            temperature: 0.7,
          });

          const reply = completion.choices[0].message.content;
          return res.json({ success: true, reply });
        }

        if (activeProvider === 'gemini' && geminiModel) {
          let prompt = `${systemPrompt}\n\n`;
          if (Array.isArray(history)) {
            history.slice(-10).forEach(msg => {
              const sender = msg.role === 'ai' || msg.role === 'assistant' ? 'SpendEase AI' : 'User';
              prompt += `${sender}: ${msg.text}\n`;
            });
          }
          prompt += `User: ${message}\nSpendEase AI:`;

          const result = await geminiModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7 }
          });
          const reply = result.response.text();
          return res.json({ success: true, reply });
        }
      } catch (err) {
        console.error('AI Chat Completion Error:', err.message);
        // Catch and fall back to keyword-based reply below
      }
    }

    // Rule-based fallback
    const reply = generateChatReply(message.toLowerCase(), {
      expenses, thisMonthExp, thisTotal, totalIncome, now, userName: req.user.name
    });

    res.json({ success: true, reply });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/ai/predictions ───────────────────────────────────
router.get('/predictions', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const expenses = await Expense.find({ user: userId, date: { $gte: threeMonthsAgo } });

    // Monthly averages
    const byMonth = {};
    expenses.forEach(e => {
      const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
      byMonth[key] = (byMonth[key] || 0) + e.amount;
    });
    const monthlyAmounts = Object.values(byMonth);
    const avgMonthly = monthlyAmounts.length > 0
      ? monthlyAmounts.reduce((s, v) => s + v, 0) / monthlyAmounts.length
      : 0;

    // Category predictions
    const catByMonth = {};
    expenses.forEach(e => {
      if (!catByMonth[e.category]) catByMonth[e.category] = [];
      catByMonth[e.category].push(e.amount);
    });
    const categoryPredictions = Object.entries(catByMonth).map(([cat, amounts]) => ({
      category: cat,
      predicted: (amounts.reduce((s, v) => s + v, 0) / Math.max(monthlyAmounts.length, 1)).toFixed(2),
    })).sort((a, b) => b.predicted - a.predicted);

    // Next 3 months forecast with slight variance
    const forecast = [1, 2, 3].map(i => {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const variance = (Math.random() - 0.5) * 0.1 * avgMonthly;
      return {
        month: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        predicted: Math.max(0, avgMonthly + variance).toFixed(2),
      };
    });

    res.json({ success: true, data: { avgMonthly: avgMonthly.toFixed(2), forecast, categoryPredictions } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Helpers ───────────────────────────────────────────────────
function generateChatReply(msg, { expenses, thisMonthExp, thisTotal, totalIncome, now, userName }) {
  const catMap = {};
  thisMonthExp.forEach(e => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
  const topCat = Object.entries(catMap).sort((a,b) => b[1]-a[1])[0];

  if (/hello|hi|hey/.test(msg))
    return `Hi ${userName}! 👋 I'm your AI financial assistant. Ask me anything about your spending, savings, or financial health!`;

  if (/how much.*spend.*this month|this month.*spend|monthly.*expense/.test(msg))
    return `This month you've spent **₹${thisTotal.toFixed(2)}**. ${topCat ? `Your biggest expense category is **${topCat[0]}** at ₹${topCat[1].toFixed(2)}.` : ''}`;

  if (/top.*categor|most.*spend|biggest.*expense/.test(msg)) {
    const sorted = Object.entries(catMap).sort((a,b) => b[1]-a[1]).slice(0,3);
    if (sorted.length === 0) return "No expenses found this month yet.";
    return `Your top spending categories this month:\n${sorted.map(([c,a],i) => `${i+1}. **${c}** – ₹${a.toFixed(2)}`).join('\n')}`;
  }

  if (/saving|save|savings/.test(msg)) {
    const savings = totalIncome - thisTotal;
    const rate = totalIncome > 0 ? ((savings/totalIncome)*100).toFixed(1) : 0;
    return savings >= 0
      ? `You've saved **₹${savings.toFixed(2)}** this month (${rate}% savings rate). ${rate >= 20 ? '🎉 Excellent job!' : rate >= 10 ? '👍 Good progress!' : '💡 Try to save at least 20% of income.'}`
      : `You're currently **₹${Math.abs(savings).toFixed(2)} over budget** this month. Consider cutting back on ${topCat ? topCat[0] : 'non-essentials'}.`;
  }

  if (/income|earn|salary/.test(msg))
    return totalIncome > 0
      ? `Your total recorded income is **₹${totalIncome.toFixed(2)}**.`
      : "I don't see any income recorded yet. Add your income in the Dashboard to get better insights!";

  if (/food|restaurant|eat|dining/.test(msg)) {
    const foodAmt = catMap['Food'] || 0;
    return foodAmt > 0
      ? `You've spent **₹${foodAmt.toFixed(2)}** on food this month. ${foodAmt > thisTotal * 0.4 ? "That's over 40% of your spending – consider cooking at home more! 🏠" : "That seems reasonable! 🍽️"}`
      : "No food expenses recorded this month.";
  }

  if (/predict|forecast|next month/.test(msg))
    return `Based on your spending history, I predict you'll spend approximately **₹${(thisTotal * 1.02).toFixed(2)}** next month. Check the AI page for detailed predictions!`;

  if (/advice|tip|suggest|recommend/.test(msg))
    return `Here are 3 personalized tips:\n1. 💡 Set a monthly budget for your top category (${topCat ? topCat[0] : 'Shopping'})\n2. 📱 Track every expense – even small ones add up\n3. 🎯 Set a savings goal to stay motivated`;

  if (/health.*score|financial.*health|score/.test(msg))
    return `Your financial health score is calculated based on savings rate, spending trends, and budget adherence. Check the AI Insights page for your current score!`;

  return `I'm not sure about that specific query, but I can help you with:\n• Monthly spending summaries\n• Category breakdowns\n• Savings analysis\n• Income tracking\n• Financial tips\n\nTry asking: *"How much did I spend this month?"*`;
}

function generateSuggestions({ savingsRate, trend, topCategory, thisTotal, incomeTotal }) {
  const tips = [];
  if (savingsRate < 10) tips.push('🎯 Aim to save at least 20% of your income each month');
  if (trend === 'up') tips.push('📉 Your spending increased this month — review your recent expenses');
  if (topCategory && topCategory[1] > thisTotal * 0.5) tips.push(`🍽️ ${topCategory[0]} is over 50% of your budget — try to diversify`);
  if (incomeTotal === 0) tips.push('💰 Add your income sources to get accurate savings analysis');
  tips.push('📊 Set category budgets to avoid overspending');
  tips.push('🔄 Review your recurring subscriptions for ones you can cancel');
  return tips.slice(0, 4);
}

module.exports = router;
