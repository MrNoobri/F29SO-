const express = require("express");
const router = express.Router();
const alertController = require("../controllers/alert.controller");
const { authenticate } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate);

// Get alerts
router.get("/", alertController.getAlerts);

// Get unread count
router.get("/unread-count", alertController.getUnreadCount);

// Mark as read
router.patch("/:id/read", alertController.markAsRead);

// Acknowledge alert
router.post("/:id/acknowledge", alertController.acknowledgeAlert);

// Delete alert
router.delete("/:id", alertController.deleteAlert);

module.exports = router;
