const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const logMessageDebug = require("../utils/messageDebugLogger");

module.exports = (io) => {
  const onlineUsers = new Map();

  // ✅ Verify JWT trước khi cho connect
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error("Không có token — kết nối bị từ chối"));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return next(new Error("User không tồn tại"));
      }
      // Gắn user vào socket để dùng về sau, không cần client tự gửi userId
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Token không hợp lệ"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`👤 User ${socket.user.username} online`);

    // Join conversation room — verify user thuộc conversation
    socket.on("conversation:join", async (conversationId) => {
      try {
        const conv = await Conversation.findById(conversationId);
        if (!conv) return;
        // Chỉ participant mới join được
        if (!conv.participants.map(String).includes(userId)) {
          socket.emit("error", {
            message: "Không có quyền vào conversation này",
          });
          return;
        }
        socket.join(conversationId);
        console.log(
          `💬 ${socket.user.username} joined conversation: ${conversationId}`,
        );
      } catch (err) {
        console.error("conversation:join error:", err);
      }
    });

    // Leave conversation room
    socket.on("conversation:leave", (conversationId) => {
      socket.leave(conversationId);
    });

    // Gửi message — dùng socket.userId thay vì tin client gửi
    socket.on("message:send", async (data) => {
      try {
        const { conversationId, content } = data;

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Verify user thuộc conversation
        if (!conversation.participants.map(String).includes(userId)) {
          socket.emit("error", { message: "Không có quyền gửi tin nhắn" });
          return;
        }

        // Lưu vào DB — senderId lấy từ socket.user, không từ client
        const message = await Message.create({
          conversationId,
          senderId: userId,
          content,
        });

        await message.populate("senderId", "name username avatar");
        logMessageDebug("socket_send", message);

        // Cập nhật lastMessage
        conversation.lastMessage = {
          content,
          senderId: userId,
          sentAt: new Date(),
        };
        await conversation.save();

        // Broadcast tới tất cả trong room
        io.to(conversationId).emit("message:receive", message);
        logMessageDebug("socket_broadcast", message);

        // Notify receiver nếu không ở trong room
        const receiverId = conversation.participants
          .map(String)
          .find((p) => p !== userId);

        if (receiverId) {
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("notification:new_message", {
              conversationId,
              message,
            });
          }
        }
      } catch (error) {
        console.error("Socket message error:", error);
        socket.emit("error", { message: error.message });
      }
    });

    // Typing indicator — dùng socket.userId
    socket.on("typing:start", (data) => {
      socket.to(data.conversationId).emit("typing:start", {
        userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("typing:stop", (data) => {
      socket.to(data.conversationId).emit("typing:stop", {
        userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log(`👤 User ${socket.user.username} offline`);
    });
  });
};
