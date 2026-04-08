const User = require("../models/User.model");
const AuditLog = require("../models/AuditLog.model");
const Alert = require("../models/Alert.model");
const Appointment = require("../models/Appointment.model");
const Message = require("../models/Message.model");
const HealthMetric = require("../models/HealthMetric.model");
const { createAuditLog } = require("../middleware/audit.middleware");

// GET /api/admin/stats — KPI summary
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      patientCount,
      providerCount,
      adminCount,
      activeAlerts,
      todayAppointments,
      totalMessages,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "provider" }),
      User.countDocuments({ role: "admin" }),
      Alert.countDocuments({ isAcknowledged: false }),
      Appointment.countDocuments({
        scheduledAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      }),
      Message.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        byRole: {
          patient: patientCount,
          provider: providerCount,
          admin: adminCount,
        },
        activeAlerts,
        todayAppointments,
        totalMessages,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

// GET /api/admin/users — paginated user list
const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const search = req.query.search;

    const filter = {};
    if (role && ["patient", "provider", "admin"].includes(role)) {
      filter.role = role;
    }
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { email: { $regex: escaped, $options: "i" } },
        { "profile.firstName": { $regex: escaped, $options: "i" } },
        { "profile.lastName": { $regex: escaped, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken -googleFitTokens")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

// PUT /api/admin/users/:id — update user role/status/profile basics
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, profile } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Prevent admin from deactivating themselves
    if (id === req.user._id.toString() && isActive === false) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot deactivate your own account",
        });
    }

    if (role && ["patient", "provider", "admin"].includes(role)) {
      user.role = role;
    }
    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    // Whitelist editable profile fields only
    const profileChanges = {};
    if (profile && typeof profile === "object") {
      if (typeof profile.firstName === "string" && profile.firstName.trim()) {
        user.profile.firstName = profile.firstName.trim();
        profileChanges.firstName = user.profile.firstName;
      }
      if (typeof profile.lastName === "string" && profile.lastName.trim()) {
        user.profile.lastName = profile.lastName.trim();
        profileChanges.lastName = user.profile.lastName;
      }
      if (typeof profile.phone === "string") {
        user.profile.phone = profile.phone.trim();
        profileChanges.phone = user.profile.phone;
      }
    }

    await user.save();

    await createAuditLog(req.user._id, req.user.role, "user-updated", {
      targetId: user._id,
      changes: { role, isActive, profile: profileChanges },
    });

    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error("Admin update user error:", error);
    res.status(500).json({ success: false, message: "Failed to update user" });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete your own account" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Clean up related data
    await Promise.all([
      HealthMetric.deleteMany({ userId: id }),
      Alert.deleteMany({ userId: id }),
      Appointment.deleteMany({ $or: [{ patientId: id }, { providerId: id }] }),
      Message.deleteMany({ $or: [{ senderId: id }, { recipientId: id }] }),
    ]);

    await User.findByIdAndDelete(id);

    await createAuditLog(req.user._id, req.user.role, "user-deleted", {
      targetId: id,
      deletedUser: { email: user.email, role: user.role },
    });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
};

// GET /api/admin/audit-logs — paginated audit logs
const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 30));
    const skip = (page - 1) * limit;
    const action = req.query.action;

    const filter = {};
    if (action) {
      filter.action = action;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate("actorId", "email profile.firstName profile.lastName role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("Admin audit logs error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch audit logs" });
  }
};

// GET /api/admin/system-metrics — aggregated system metrics
const getSystemMetrics = async (req, res) => {
  try {
    const [
      alertsBySeverity,
      appointmentsByStatus,
      usersByRole,
      recentRegistrations,
    ] = await Promise.all([
      Alert.aggregate([{ $group: { _id: "$severity", count: { $sum: 1 } } }]),
      Appointment.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    // Convert aggregation arrays to objects
    const severityMap = {};
    alertsBySeverity.forEach((a) => {
      severityMap[a._id] = a.count;
    });

    const statusMap = {};
    appointmentsByStatus.forEach((a) => {
      statusMap[a._id] = a.count;
    });

    const roleMap = {};
    usersByRole.forEach((a) => {
      roleMap[a._id] = a.count;
    });

    res.json({
      success: true,
      data: {
        alertsBySeverity: severityMap,
        appointmentsByStatus: statusMap,
        usersByRole: roleMap,
        recentRegistrations,
      },
    });
  } catch (error) {
    console.error("Admin system metrics error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch system metrics" });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getAuditLogs,
  getSystemMetrics,
};
