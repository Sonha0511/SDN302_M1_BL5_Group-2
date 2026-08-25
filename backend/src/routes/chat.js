const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createLimiter } = require("../middleware/rateLimiter");
const {
  getConversations,
  searchMembers,
  getMessages,
  getOrCreateConversation,
  sendMessage,
} = require("../controllers/chatController");

router.get("/conversations", auth, getConversations);
router.get("/members", auth, searchMembers);
router.post("/conversations", auth, createLimiter, getOrCreateConversation);
router.get("/conversations/:id/messages", auth, getMessages);
router.post("/conversations/:id/messages", auth, createLimiter, sendMessage);

module.exports = router;
