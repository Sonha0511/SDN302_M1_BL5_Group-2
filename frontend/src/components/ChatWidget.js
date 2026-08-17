import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import SellerReputation from "./SellerReputation";
import { io } from "socket.io-client";

let socket = null;
const getSocket = (token) => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      auth: { token },
    });
  }
  return socket;
};

function ChatWidget({
  sellerId,
  sellerName,
  sellerReputation,
  listingId,
  listingTitle,
  listingPrice,
  listingImage,
  buttonStyle,
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("token");
    const s = getSocket(token);

    s.on("message:receive", (message) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    s.on("typing:start", () => setIsTyping(true));
    s.on("typing:stop", () => setIsTyping(false));

    return () => {
      s.off("message:receive");
      s.off("typing:start");
      s.off("typing:stop");
    };
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openChat = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setIsOpen(true);
    if (conversation) return;
    setLoading(true);
    try {
      const res = await api.post("/chat/conversations", {
        receiverId: sellerId,
        listingId: listingId || null,
      });
      setConversation(res.data);
      getSocket(localStorage.getItem("token")).emit(
        "conversation:join",
        res.data._id,
      );
      const msgRes = await api.get(
        `/chat/conversations/${res.data._id}/messages`,
      );
      setMessages(msgRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !conversation) return;
    const content = input.trim();
    setInput("");
    getSocket(localStorage.getItem("token")).emit("message:send", {
      conversationId: conversation._id,
      content,
      // senderId tự lấy từ JWT
    });
    getSocket(localStorage.getItem("token")).emit("typing:stop", {
      conversationId: conversation._id,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    getSocket(localStorage.getItem("token")).emit("typing:start", {
      conversationId: conversation?._id,
    });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      getSocket(localStorage.getItem("token")).emit("typing:stop", {
        conversationId: conversation?._id,
      });
    }, 1500);
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Button khi chưa mở chat
  if (!isOpen) {
    if (buttonStyle === "small") {
      return (
        <button
          onClick={openChat}
          className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-1.5 rounded-full text-sm transition"
        >
          Message
        </button>
      );
    }
    return (
      <button
        onClick={openChat}
        className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-full font-semibold text-sm transition flex items-center justify-center gap-2"
      >
        Message seller
      </button>
    );
  }

  return (
    <>
      {/* Overlay mờ phía sau */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* Panel chat full chiều cao bên phải */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white z-50 flex flex-col shadow-2xl">
        {/* ── 1. HEADER: "Message seller" + nút đóng ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Message seller
          </h2>
          <button
            onClick={() => {
              setIsOpen(false);
              setConversation(null);
              setMessages([]);
            }}
            className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── 2. SELLER PROFILE ── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100">
          <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {sellerName?.charAt(0)?.toUpperCase() || "S"}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {sellerName || "seller"}
            </p>
            <SellerReputation reputation={sellerReputation} compact />
          </div>
        </div>

        {/* ── 3. LISTING PREVIEW ── */}
        {listingTitle && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50">
            <div className="w-11 h-11 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
              {listingImage ? (
                <img
                  src={listingImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  img
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug">
                {listingTitle}
              </p>
              {listingPrice && (
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {listingPrice}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate(`/checkout/${listingId}`)}
              className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full hover:bg-blue-700 transition flex-shrink-0 font-medium"
            >
              Buy It Now
            </button>
          </div>
        )}

        {/* ── 4. POLICY TEXT ── */}
        <div className="px-4 py-2 border-b border-gray-100 bg-white">
          <p className="text-xs text-gray-500 leading-snug">
            We scan and review messages for fraud,{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">
              policy violations
            </span>
            , and to surface relevant service-related help.{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">
              Learn more
            </span>
          </p>
        </div>

        {/* ── 5. MESSAGES AREA (flex-1 để chiếm hết phần còn lại) ── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading messages...</span>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div />
          ) : (
            messages.map((msg) => {
              const isMe =
                msg.senderId?._id === user?._id || msg.senderId === user?._id;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-xs mr-2 flex-shrink-0 self-end">
                      {sellerName?.charAt(0)?.toUpperCase() || "S"}
                    </div>
                  )}
                  <div
                    className={`max-w-xs flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`px-4 py-2 rounded-2xl text-sm break-words ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-gray-100 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start items-center gap-2">
              <div className="w-7 h-7 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                {sellerName?.charAt(0)?.toUpperCase() || "S"}
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1 items-center">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── 6. INPUT + SEND MESSAGE BUTTON ── */}
        <div className="border-t border-gray-200 px-4 pt-3 pb-4 bg-white flex flex-col gap-2">
          {/* Text input + icon ảnh */}
          <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 focus-within:border-blue-500 transition">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send message"
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
            />
            {/* Nút gửi ảnh */}
            <button className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>

          {/* Nút Send message */}
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2.5 rounded-xl font-semibold text-sm transition"
          >
            Send message
          </button>
        </div>
      </div>
    </>
  );
}

export default ChatWidget;
