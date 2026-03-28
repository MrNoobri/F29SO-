const express = require("express");
const { sendChatMessage } = require("../controllers/chatbot.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/message", authenticate, sendChatMessage);

module.exports = router;
