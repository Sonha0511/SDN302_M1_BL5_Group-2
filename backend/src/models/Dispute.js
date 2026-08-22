const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order", // Points to the Order collection
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Reason category, so admins can report on dispute drivers
    reason: {
      type: String,
      enum: [
        "NOT_RECEIVED",
        "WRONG_ITEM",
        "DAMAGED",
        "NOT_AS_DESCRIBED",
        "FAKE_COUNTERFEIT",
        "MISSING_PARTS",
        "LATE_DELIVERY",
        "REFUND_NOT_RECEIVED",
        "OTHER",
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    // URLs of the photos the buyer attached as proof
    evidenceImages: [
      {
        type: String,
      },
    ],

    // Latest message the seller sent back to the buyer
    sellerResponse: {
      type: String,
      default: "",
    },

    // Detailed state of the resolution flow
    status: {
      type: String,
      enum: [
        "OPEN", // Just created, waiting for the seller to respond
        "SELLER_RESPONDED", // Seller has replied
        "ESCALATED", // Buyer was not satisfied -> escalated to eBay
        "UNDER_REVIEW", // Admin is reviewing the case
        "RESOLVED_REFUND", // Closed with a refund
        "RESOLVED_REPLACE", // Closed with a replacement
        "RESOLVED_REJECTED", // Dispute was rejected
        "CLOSED", // Closed (buyer withdrew it, or it timed out)
      ],
      default: "OPEN",
    },

    // Final outcome of the case
    resolution: {
      type: {
        type: String,
        enum: [
          "REFUND_FULL",
          "REFUND_PARTIAL",
          "REPLACEMENT",
          "REJECTED",
          "NONE",
        ],
        default: "NONE",
      },
      amount: Number, // Used for partial refunds
      note: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // The admin or seller who closed the case
      },
      resolvedAt: Date,
    },

    // Activity history, rendered as a stepper in the UI
    timeline: [
      {
        actor: {
          type: String,
          enum: ["buyer", "seller", "admin", "system"],
          required: true,
        },
        action: {
          type: String,
          required: true, // e.g. "created", "seller_replied", "escalated"
        },
        note: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // How urgent the case is
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Dispute", disputeSchema);
