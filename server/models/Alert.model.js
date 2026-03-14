const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    type: {
      type: String,
      enum: ["health-metric", "appointment", "medication", "system"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    metricSnapshot: {
      metricType: String,
      value: mongoose.Schema.Types.Mixed,
      unit: String,
      threshold: mongoose.Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isAcknowledged: {
      type: Boolean,
      default: false,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledgedAt: Date,
    resolvedAt: Date,
    expiresAt: Date,
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
alertSchema.index({ userId: 1, isRead: 1, severity: 1 });
alertSchema.index({ createdAt: -1 });

// Static method to get unread alerts count
alertSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ userId, isRead: false });
};

// Static method to get critical alerts
alertSchema.statics.getCriticalAlerts = function (userId) {
  return this.find({
    userId,
    severity: "critical",
    isAcknowledged: false,
  }).sort({ createdAt: -1 });
};

const Alert = mongoose.model("Alert", alertSchema);

module.exports = Alert;
