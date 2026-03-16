const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getAuditLogs,
  getSystemMetrics,
} = require("../controllers/admin.controller");

// All admin routes require authentication + admin role
router.use(authenticate, authorize("admin"));

router.get("/stats", getStats);
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.get("/audit-logs", getAuditLogs);
router.get("/system-metrics", getSystemMetrics);

module.exports = router;
