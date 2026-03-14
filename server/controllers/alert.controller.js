const Alert = require("../models/Alert.model");

/**
 * Get user alerts
 */
const getAlerts = async (req, res) => {
  try {
    const { isRead, isAcknowledged, severity, limit = 50 } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === "patient") {
      query.userId = req.user._id;
    } else if (req.user.role === "provider") {
      if (req.query.patientIds) {
        const ids = req.query.patientIds.split(",").map((id) => id.trim());
        query.userId = { $in: ids };
      } else if (req.query.userId) {
        query.userId = req.query.userId;
      }
    }

    if (isRead !== undefined) {
      query.isRead = isRead === "true";
    }

    if (isAcknowledged !== undefined) {
      query.isAcknowledged = isAcknowledged === "true";
    }

    if (severity) {
      query.severity = severity;
    }

    // Auto-exclude alerts acknowledged more than 3 days ago (resolved alerts expire)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    query.$and = [
      ...(query.$and || []),
      {
        $or: [
          { isAcknowledged: false },
          { isAcknowledged: true, acknowledgedAt: { $gte: threeDaysAgo } },
        ],
      },
    ];

    const alerts = await Alert.find(query)
      .populate("userId", "profile.firstName profile.lastName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve alerts",
    });
  }
};

/**
 * Get unread alerts count
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Alert.getUnreadCount(req.user._id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

/**
 * Mark alert as read
 */
const markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Authorization check
    if (
      alert.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "provider"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    alert.isRead = true;
    await alert.save();

    res.json({
      success: true,
      message: "Alert marked as read",
      data: alert,
    });
  } catch (error) {
    console.error("Mark as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark alert as read",
    });
  }
};

/**
 * Acknowledge alert (provider action)
 */
const acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Providers/admins can acknowledge any alert; patients can acknowledge their own
    if (req.user.role === "patient") {
      if (alert.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    } else if (req.user.role !== "provider" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only healthcare providers can acknowledge alerts",
      });
    }

    alert.isAcknowledged = true;
    alert.acknowledgedBy = req.user._id;
    alert.acknowledgedAt = new Date();
    alert.isRead = true;

    await alert.save();

    res.json({
      success: true,
      message: "Alert acknowledged successfully",
      data: alert,
    });
  } catch (error) {
    console.error("Acknowledge alert error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to acknowledge alert",
    });
  }
};

/**
 * Delete alert
 */
const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found",
      });
    }

    // Authorization check
    if (
      alert.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Alert.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Alert deleted successfully",
    });
  } catch (error) {
    console.error("Delete alert error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete alert",
    });
  }
};

module.exports = {
  getAlerts,
  getUnreadCount,
  markAsRead,
  acknowledgeAlert,
  deleteAlert,
};
