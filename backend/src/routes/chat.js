const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getConversations,
  getMessages,
  getOrCreateConversation,
  sendMessage,
} = require("../controllers/chatController");

router.get("/conversations", auth, getConversations);
router.post("/conversations", auth, getOrCreateConversation);
router.get("/conversations/:id/messages", auth, getMessages);
router.post("/conversations/:id/messages", auth, sendMessage);

module.exports = router;
