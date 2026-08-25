const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  bidderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true, min: 1 },
}, { timestamps: true });

module.exports = mongoose.model("Bid", bidSchema);
