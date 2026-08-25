const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const logMessageDebug = require("../utils/messageDebugLogger");

// GET /api/chat/conversations - lấy tất cả conversations của user
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.userId,
    })
      .populate("participants", "name username avatar")
      .populate("listingId", "title images")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search active members before composing a new eBay-style message.
exports.searchMembers = async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length < 2) return res.json([]);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const members = await User.find({ _id: { $ne: req.userId }, isActive: true, $or: [{ username: { $regex: escaped, $options: "i" } }, { name: { $regex: escaped, $options: "i" } }] })
      .select("name username avatar role sellerProfile.storeName").limit(10);
    res.json(members);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

// GET /api/chat/conversations/:id/messages - lấy messages của 1 conversation
exports.getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation không tồn tại" });
    }

    // Kiểm tra user có trong conversation không
    if (!conversation.participants.map(String).includes(req.userId)) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const messages = await Message.find({ conversationId: req.params.id })
      .populate("senderId", "name username avatar")
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId: req.params.id,
        senderId: { $ne: req.userId },
        isRead: false,
      },
      { isRead: true, readAt: new Date() },
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/chat/conversations - tạo hoặc lấy conversation giữa 2 user
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId, listingId } = req.body;

    // Chỉ tìm theo participants, BỎ listingId
    let conversation = await Conversation.findOne({
      participants: { $all: [req.userId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.userId, receiverId],
        listingId: listingId || null, // vẫn lưu listing đầu tiên
        unreadCount: { [receiverId]: 0, [req.userId]: 0 },
      });
    }

    await conversation.populate("participants", "name username avatar");
    await conversation.populate("listingId", "title images");

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/chat/conversations/:id/messages - gửi message (REST fallback)
exports.sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation không tồn tại" });
    }
    if (!conversation.participants.map(String).includes(req.userId)) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    const message = await Message.create({
      conversationId: req.params.id,
      senderId: req.userId,
      content,
    });

    // Cập nhật lastMessage
    conversation.lastMessage = {
      content,
      senderId: req.userId,
      sentAt: new Date(),
    };
    await conversation.save();

    await message.populate("senderId", "name username avatar");
    logMessageDebug("rest_send", message);
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
