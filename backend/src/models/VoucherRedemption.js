const mongoose = require("mongoose");

const voucherRedemptionSchema = new mongoose.Schema({
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: "Voucher", required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  discountAmount: { type: Number, required: true },
}, { timestamps: true });
voucherRedemptionSchema.index({ voucherId: 1, buyerId: 1 });
module.exports = mongoose.model("VoucherRedemption", voucherRedemptionSchema);
