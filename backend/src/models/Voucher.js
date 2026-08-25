const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: false,
    },
    eligibleScope: { type: String, enum: ["all", "selected"], default: "selected" },
    eligibleListingIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    campaignName: { type: String, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 300 },
    maxUsesPerBuyer: { type: Number, default: null },
    campaignBudget: { type: Number, default: 0 },
    discountGiven: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: 0, // 0 means no cap
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voucher", voucherSchema);
