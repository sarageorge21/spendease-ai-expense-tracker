const { Notification } = require('../models/index');

/**
 * Creates a notification for a user.
 * @param {string} userId - ID of the user.
 * @param {string} title - Notification title.
 * @param {string} message - Detailed notification message.
 * @param {string} type - 'info', 'warning', 'success', or 'alert'.
 */
async function createNotification(userId, title, message, type = 'info') {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type,
      read: false
    });
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err.message);
    return null;
  }
}

module.exports = { createNotification };
