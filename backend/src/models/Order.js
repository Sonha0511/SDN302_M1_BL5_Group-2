const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
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
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
    },
    listingTitle: { type: String },
    listingImage: { type: String },
    quantity: { type: Number, default: 1 },
    pricing: {
      itemPrice: { type: Number },
      quantity: { type: Number },
      subtotal: { type: Number },
      shippingCost: { type: Number, default: 0 },
      total: { type: Number },
      currency: { type: String, default: "VND" },
    },
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      street: { type: String },
      city: { type: String },
      country: { type: String, default: "Vietnam" },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "awaiting_payment",
        "awaiting_shipment",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "bank_transfer", "paypal"],
      default: "COD",
    },
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
