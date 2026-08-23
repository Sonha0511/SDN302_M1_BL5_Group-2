const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedbackType: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "positive",
    },
    detailedRatings: {
      itemDescription: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      shippingTime: { type: Number, min: 1, max: 5 },
      shippingCost: { type: Number, min: 1, max: 5 },
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    images: [{ type: String }],
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    // A public, single seller response mirrors the marketplace feedback model:
    // it provides context without allowing the original buyer feedback to be changed.
    sellerResponse: {
      comment: { type: String, trim: true, maxlength: 500 },
      respondedAt: { type: Date },
    },
  },
  { timestamps: true },
);

reviewSchema.index({ listingId: 1, createdAt: -1 });

module.exports = mongoose.model("Review", reviewSchema);
