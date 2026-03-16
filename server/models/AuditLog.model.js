const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ["patient", "provider", "admin"],
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "login-google",
        "logout",
        "register",
        "password-set",
        "view-patient-data",
        "edit-patient-data",
        "create-appointment",
        "cancel-appointment",
        "send-message",
        "create-alert",
        "acknowledge-alert",
        "user-created",
        "user-updated",
        "user-deleted",
        "settings-changed",
        "data-exported",
      ],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "targetModel",
    },
    targetModel: {
      type: String,
      enum: ["User", "HealthMetric", "Appointment", "Message", "Alert"],
    },
    ipAddress: String,
    userAgent: String,
    details: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  },
);

// Indexes for efficient queries
auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
