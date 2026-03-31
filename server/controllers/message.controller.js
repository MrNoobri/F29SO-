const Message = require("../models/Message.model");
const User = require("../models/User.model");
const { createAuditLog } = require("../middleware/audit.middleware");

/**
 * Sanitize HTML to prevent stored XSS in messages
 */
const sanitizeHtml = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Send message
 */
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    const conversationId = Message.createConversationId(
      req.user._id,
      recipientId,
    );

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      recipientId,
      content: sanitizeHtml(content),
      type: "text",
    });

    await message.populate(
      "senderId recipientId",
      "profile.firstName profile.lastName role",
    );

    await createAuditLog(req.user._id, req.user.role, "send-message", {
      targetId: message._id,
      targetModel: "Message",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });

    // Emit real-time event
    const io = req.app.get("io");
    if (io) {
      const messageData = message.toObject();
      io.to(`conversation:${conversationId}`).emit("new-message", messageData);
      io.to(`user:${recipientId}`).emit("new-message", messageData);
    }
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

/**
 * Get conversations
 */
const getConversations = async (req, res) => {
  try {
    // Get all unique conversation partners
    const messages = await Message.find({
      $or: [{ senderId: req.user._id }, { recipientId: req.user._id }],
    })
      .populate(
        "senderId recipientId",
        "profile.firstName profile.lastName role avatar",
      )
      .sort({ createdAt: -1 });

    // Group by conversation and get latest message
    const conversationMap = new Map();

    messages.forEach((message) => {
      const conversationId = message.conversationId;

      if (!conversationMap.has(conversationId)) {
        const partnerId =
          message.senderId._id.toString() === req.user._id.toString()
            ? message.recipientId
            : message.senderId;

        conversationMap.set(conversationId, {
          conversationId,
          participant: partnerId,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages
      if (
        message.recipientId._id.toString() === req.user._id.toString() &&
        !message.isRead
      ) {
        conversationMap.get(conversationId).unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values());

    res.json({
      success: true,
      data: conversations,
      count: conversations.length,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations",
    });
  }
};

/**
 * Get messages in conversation
 */
const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, before } = req.query;

    const conversationId = Message.createConversationId(req.user._id, userId);

    const query = { conversationId };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate(
        "senderId recipientId",
        "profile.firstName profile.lastName role",
      )
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        recipientId: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    // Emit read receipt
    const io = req.app.get("io");
    if (io) {
      io.to(`conversation:${conversationId}`).emit("messages-read", {
        conversationId,
        readBy: req.user._id,
      });
    }

    res.json({
      success: true,
      data: messages.reverse(),
      count: messages.length,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve messages",
    });
  }
};

/**
 * Get unread message count
 */
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.getUnreadCount(req.user._id);

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
 * Delete message
 */
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Authorization check - only sender can delete
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  getUnreadCount,
  deleteMessage,
};
