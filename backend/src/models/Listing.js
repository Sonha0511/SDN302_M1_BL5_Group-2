const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "acceptable"],
      default: "new",
    },
    images: [{ type: String }],
    pricing: {
      currency: { type: String, default: "VND" },
      fixedPrice: { type: Number },
    },
    totalQuantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["active", "inactive", "sold"],
      default: "active",
    },
    isFeatured: { type: Boolean, default: false },
    isPromoted: { type: Boolean, default: false },
    stats: {
      views: { type: Number, default: 0 },
      watchers: { type: Number, default: 0 },
      soldQuantity: { type: Number, default: 0 },
    },
    reviews: {
      averageRating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
    shippingPolicyId: { type: mongoose.Schema.Types.ObjectId },
    returnPolicyId: { type: mongoose.Schema.Types.ObjectId },
    paymentPolicyId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Listing", listingSchema);
