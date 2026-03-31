const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const { authenticate } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const { validateFileContent } = require("../middleware/upload.middleware");

// All routes require authentication
router.use(authenticate);

// Send message
router.post("/", messageController.sendMessage);

// Upload file attachment
router.post("/upload", upload.single("file"), validateFileContent, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  res.json({
    success: true,
    data: {
      url: `/uploads/${req.file.filename}`,
      type: req.file.mimetype.startsWith("image/") ? "image" : "document",
      size: req.file.size,
      originalName: req.file.originalname,
    },
  });
});

// Get conversations
router.get("/conversations", messageController.getConversations);

// Get unread count
router.get("/unread-count", messageController.getUnreadCount);

// Get messages with specific user
router.get("/:userId", messageController.getMessages);

// Delete message
router.delete("/:id", messageController.deleteMessage);

module.exports = router;
