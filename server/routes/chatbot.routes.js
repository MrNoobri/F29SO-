const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbot.controller");
const { authenticate } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(authenticate);

// Send message to chatbot
router.post("/message", chatbotController.sendChatMessage);

// Get suggested questions
router.get("/suggestions", chatbotController.getSuggestedQuestions);

module.exports = router;
