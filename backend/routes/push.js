const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const { protect } = require('../middleware/auth'); // assuming users are authenticated when subscribing

// Initialize web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@megakem.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// @route   GET /api/push/vapidPublicKey
// @desc    Get VAPID public key for frontend subscription
// @access  Public
router.get('/vapidPublicKey', (req, res) => {
  res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// @route   POST /api/push/subscribe
// @desc    Subscribe a user to push notifications
// @access  Private
router.post('/subscribe', protect, async (req, res) => {
  try {
    const subscription = req.body;
    
    // Check if subscription already exists
    let existingSub = await PushSubscription.findOne({ endpoint: subscription.endpoint });
    
    if (existingSub) {
      existingSub.userId = req.user._id;
      existingSub.role = req.user.role;
      await existingSub.save();
    } else {
      await PushSubscription.create({
        ...subscription,
        userId: req.user._id,
        role: req.user.role
      });
    }

    res.status(201).json({ success: true, message: 'Subscribed successfully.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

// @route   POST /api/push/sendNotification
// @desc    Send push notification (Admin only)
// @access  Private (Needs admin protect, handled in server.js or here)
router.post('/sendNotification', protect, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.email !== 'admin@megakem.com') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  const { title, body, icon, url, targetRole } = req.body;
  const payload = JSON.stringify({ title, body, icon, url });

  try {
    let query = {};
    if (targetRole && targetRole !== 'all') {
      query.role = targetRole;
    }

    const subscriptions = await PushSubscription.find(query);
    
    const sendPromises = subscriptions.map(sub => {
      return webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys
        },
        payload
      ).catch(err => {
        // If subscription is gone, remove it from DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log('Subscription has expired or is no longer valid: ', err);
          return PushSubscription.deleteOne({ endpoint: sub.endpoint });
        }
      });
    });

    await Promise.all(sendPromises);

    res.status(200).json({ success: true, message: `Notification sent to ${subscriptions.length} devices.` });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send notification' });
  }
});

module.exports = router;
