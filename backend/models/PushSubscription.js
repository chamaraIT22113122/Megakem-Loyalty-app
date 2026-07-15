const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true, unique: true },
  expirationTime: { type: Date, default: null },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
