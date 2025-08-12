const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SubscriptionSchema = new Schema({
  subscriber: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// A user can only subscribe to a channel once
SubscriptionSchema.index({ 
  subscriber: 1, 
  channel: 1 
}, { 
  unique: true 
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);
module.exports = Subscription;