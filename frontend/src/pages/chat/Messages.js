import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
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

const formatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) {
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return d.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
};

function Messages() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Inbox");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeout = useRef(null);
  const requestedConversationId = location.state?.conversationId;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    const token = localStorage.getItem("token");
    const s = getSocket(token);
    socketRef.current = s;
    fetchConversations();

    s.on("message:receive", (message) => {
      if (selected && message.conversationId === selected._id) {
        setMessages((prev) =>
          prev.find((m) => m._id === message._id) ? prev : [...prev, message],
        );
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === message.conversationId
            ? {
                ...c,
                lastMessage: {
                  content: message.content,
                  sentAt: message.createdAt,
                },
              }
            : c,
        ),
      );
    });

    s.on("typing:start", () => setIsTyping(true));
    s.on("typing:stop", () => setIsTyping(false));

    return () => {
      s.off("message:receive");
      s.off("typing:start");
      s.off("typing:stop");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, selected]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data);
      const requestedConversation = res.data.find(
        (conversation) => conversation._id === requestedConversationId,
      );
      if (requestedConversation) {
        await selectConversation(requestedConversation);
        navigate("/messages", { replace: true });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv) => {
    setSelected(conv);
    setMsgLoading(true);
    socketRef.current.emit("conversation:join", conv._id);
    try {
      const res = await api.get(`/chat/conversations/${conv._id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setMsgLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !selected) return;
    socketRef.current.emit("message:send", {
      conversationId: selected._id,
      content: input.trim(),
      // senderId không cần gửi — server tự lấy từ JWT
    });
    socketRef.current.emit("typing:stop", { conversationId: selected._id });
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    socketRef.current.emit("typing:start", { conversationId: selected?._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketRef.current.emit("typing:stop", { conversationId: selected?._id });
    }, 1500);
  };

  const getOtherParticipant = (conv) =>
    conv.participants?.find((p) => p._id !== user?._id);

  const sidebarItems = [
    { label: "Inbox", badge: null },
    { label: "From members", badge: null },
    {
      label: "Unread from members",
      badge:
        conversations.filter((c) => c.unreadCount?.[user?._id] > 0).length ||
        null,
    },
    { label: "From eBay", badge: null },
    { label: "Unread from eBay", badge: null },
    { label: "Sent", badge: null },
    { label: "Deleted", badge: null },
    { label: "Archive", badge: null },
  ];

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar hideCategories />

      {/* Wrapper toàn bộ — cách mép 80px */}
      <div className="mx-[80px] flex-1 flex flex-col overflow-hidden">
        <div className="border-t border-gray-300" />
        <div className="flex gap-0 flex-1 pt-[10px] overflow-hidden">
          {/* ── Col 1: Sidebar Messages (1.5x) ── */}
          <div className="flex-shrink-0 pr-2" style={{ width: "300px" }}>
            {/* Title */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h1 className="text-base font-semibold text-gray-800">
                Messages
              </h1>
            </div>

            {/* Nav items */}
            <nav className="flex flex-col">
              {sidebarItems.map(({ label, badge }) => (
                <button
                  key={label}
                  onClick={() => setActiveFilter(label)}
                  className={`flex items-center justify-between px-3 py-2 text-sm rounded-md text-left transition ${
                    activeFilter === label
                      ? "bg-gray-200 font-bold text-gray-900"
                      : "text-gray-700 font-medium hover:bg-gray-100"
                  }`}
                >
                  <span>{label}</span>
                  {badge > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-4">
              <hr className="border-gray-200 mb-3" />
              <div className="px-3">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Folders
                </p>
                <button className="text-sm text-blue-600 hover:underline">
                  Create folder
                </button>
              </div>
            </div>
          </div>

          {/* ── Col 2: Conversation list (2.5x) — cách col 1 8px ── */}
          <div
            className="flex-shrink-0 flex flex-col bg-white border-b border-l border-r border-gray-200 overflow-hidden ml-[8px]"
            style={{ width: "600px" }}
          >
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                <svg
                  className="w-4 h-4 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search all member messages"
                  className="flex-1 text-xs bg-transparent outline-none text-gray-600 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Actions bar */}
            <div className="flex items-center px-3 py-2 border-b border-gray-100 gap-3">
              <input type="checkbox" className="w-3.5 h-3.5 accent-blue-600" />
              <div className="flex gap-3 text-gray-400">
                {["🗑", "📥", "✉️", "🗃"].map((icon, i) => (
                  <button
                    key={i}
                    className="text-sm hover:text-gray-600 transition"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                  <img
                    src={require("../../assets/images/no-messages.png")}
                    alt="No messages"
                    className="w-60 h-60 object-contain"
                  />
                  <p className="text-sm font-medium text-black">No messages</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isSelected = selected?._id === conv._id;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => selectConversation(conv)}
                      className={`flex items-start gap-3 px-3 py-3 cursor-pointer border-b border-gray-50 transition ${
                        isSelected
                          ? "bg-blue-50 border-l-2 border-l-blue-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                        {other?.username?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-semibold text-gray-800 truncate">
                            {other?.username || "Unknown"}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(
                              conv.lastMessage?.sentAt || conv.updatedAt,
                            )}
                          </span>
                        </div>
                        {conv.listingId && (
                          <p className="text-xs text-gray-500 truncate">
                            {conv.listingId.title}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {conv.lastMessage?.content || "No messages yet"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Col 3: Chat panel — cách col 2 8px ── */}
          <div className="flex-1 bg-white border-l border-b border-gray-200 overflow-hidden flex flex-col">
            {!selected ? (
              <div className="flex-1" />
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">
                    {getOtherParticipant(selected)?.username}
                  </p>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="5" cy="12" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="19" cy="12" r="2" />
                    </svg>
                  </button>
                </div>

                {/* Listing preview */}
                {selected.listingId && (
                  <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-100 bg-gray-50">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                      {selected.listingId.images?.[0] ? (
                        <img
                          src={selected.listingId.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          img
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 line-clamp-2">
                        {selected.listingId.title}
                      </p>
                    </div>
                  </div>
                )}

                {/* Policy notice */}
                <div className="px-5 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400">
                    Don't exchange contact info to buy or sell outside eBay. We
                    scan and, in case of suspicious activity, manually analyze
                    messages to identify potential fraud and policy violations.
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
                  {msgLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe =
                        msg.senderId?._id === user?._id ||
                        msg.senderId === user?._id;
                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs mr-2 flex-shrink-0 self-end">
                              {getOtherParticipant(selected)
                                ?.username?.charAt(0)
                                ?.toUpperCase()}
                            </div>
                          )}
                          <div
                            className={`flex flex-col gap-1 max-w-xs ${isMe ? "items-end" : "items-start"}`}
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

                  {isTyping && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                        {getOtherParticipant(selected)
                          ?.username?.charAt(0)
                          ?.toUpperCase()}
                      </div>
                      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                        <div className="flex gap-1">
                          {[0, 150, 300].map((d) => (
                            <div
                              key={d}
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${d}ms` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 py-2 focus-within:border-blue-500 transition">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Send message"
                      className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
                    />
                    <button className="text-gray-400 hover:text-gray-600 flex-shrink-0">
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
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-2 rounded-xl font-semibold text-sm transition"
                  >
                    Send message
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-white">
        <div className="mx-[80px] py-3 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-y-1 border-t border-gray-300">
          <p className="flex flex-wrap gap-x-1">
            <span>Copyright © 1995-2026 eBay Inc. All Rights Reserved.</span>
            {[
              "Accessibility",
              "User Agreement",
              "Privacy",
              "Consumer Health Data",
              "Payments Terms of Use",
              "Cookies",
              "CA Privacy Notice",
              "Your Privacy Choices",
            ].map((label, i, arr) => (
              <span key={label}>
                <button className="hover:underline">{label}</button>
                {i < arr.length - 1 ? "," : " and"}
              </span>
            ))}
            <button className="hover:underline">AdChoice</button>
          </p>
          <button className="hover:underline whitespace-nowrap">
            Updated messaging feedback
          </button>
        </div>
      </footer>
    </div>
  );
}

export default Messages;
