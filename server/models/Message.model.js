const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "system", "alert"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    attachments: [
      {
        type: String,
        url: String,
        size: Number,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, isRead: 1 });

// Static method to create conversation ID
messageSchema.statics.createConversationId = function (userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return ids.join("_");
};

// Static method to get unread count
messageSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ recipientId: userId, isRead: false });
};

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
