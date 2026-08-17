const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      default: null,
    },
    lastMessage: {
      content: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sentAt: { type: Date },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Conversation", conversationSchema);
