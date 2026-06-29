const { Recurring, Notification } = require('../models/index');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

/**
 * Checks and processes due recurring expenses.
 */
async function processRecurringExpenses() {
  try {
    console.log('🔄 Running Recurring Expense Automator...');
    const now = new Date();
    
    // Find all active recurring expenses where nextDue has passed
    const dueItems = await Recurring.find({
      isActive: true,
      nextDue: { $lte: now }
    });

    if (dueItems.length === 0) {
      console.log('✅ No recurring expenses due.');
      return;
    }

    console.log(`⏳ Processing ${dueItems.length} due recurring expenses...`);

    for (const item of dueItems) {
      // 1. Create a new Expense
      await Expense.create({
        user: item.user,
        title: item.title,
        amount: item.amount,
        category: item.category,
        date: item.nextDue, // Use the scheduled due date as the transaction date
        isRecurring: true,
        source: 'recurring'
      });

      // 2. Fetch user to get their preferred currency symbol
      const user = await User.findById(item.user);
      const userCurrency = user?.currency || '₹';

      // 3. Create Notification
      await createNotification(
        item.user,
        'Recurring Expense Processed 🔄',
        `Your recurring expense "${item.title}" of ${userCurrency}${item.amount.toFixed(2)} was automatically logged.`,
        'success'
      );

      // 4. Calculate the next due date
      const currentDue = new Date(item.nextDue);
      let nextDue = new Date(currentDue);

      if (item.frequency === 'daily') {
        nextDue.setDate(currentDue.getDate() + 1);
      } else if (item.frequency === 'weekly') {
        nextDue.setDate(currentDue.getDate() + 7);
      } else if (item.frequency === 'monthly') {
        nextDue.setMonth(currentDue.getMonth() + 1);
      } else if (item.frequency === 'yearly') {
        nextDue.setFullYear(currentDue.getFullYear() + 1);
      }

      // Update the recurring scheduled item
      item.nextDue = nextDue;
      await item.save();
      
      console.log(`Processed recurring item "${item.title}". Next due: ${nextDue.toISOString()}`);
    }
    
    console.log('✅ Finished processing recurring expenses.');
  } catch (err) {
    console.error('❌ Error processing recurring expenses:', err.message);
  }
}

/**
 * Initializes the recurring automator.
 * Runs once immediately, and schedules check every 1 hour.
 */
function initRecurringAutomator() {
  // Run on startup
  processRecurringExpenses();
  
  // Run every 1 hour
  const intervalMs = 60 * 60 * 1000;
  setInterval(processRecurringExpenses, intervalMs);
}

module.exports = { initRecurringAutomator, processRecurringExpenses };
