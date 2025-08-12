const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Receiver
  type: { type: String, enum: ["upload", "like", "comment", 'live'], required: true },
  message: { type: String, required: true },
  relatedId: mongoose.Schema.Types.ObjectId, // e.g., videoId;
  relatedId2: mongoose.Schema.Types.ObjectId,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
