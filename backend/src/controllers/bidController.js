const Bid = require("../models/Bid");
const Listing = require("../models/Listing");

exports.placeBid = async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found." });
    if (listing.status !== "active" || listing.pricing?.format !== "auction") return res.status(400).json({ message: "This item is not available for bidding." });
    if (listing.pricing?.auctionEndsAt && listing.pricing.auctionEndsAt <= new Date()) return res.status(400).json({ message: "This auction has ended." });
    if (String(listing.sellerId) === req.userId) return res.status(403).json({ message: "You cannot bid on your own listing." });
    const latestBid = await Bid.findOne({ listingId: listing._id }).sort({ createdAt: -1 });
    if (latestBid && String(latestBid.bidderId) === req.userId) {
      return res.status(400).json({ message: "Wait for another buyer to place a bid before bidding again." });
    }
    const minimum = Math.max(Number(listing.pricing.currentBid || 0), Number(listing.pricing.startingBid || 0));
    if (!Number.isFinite(amount) || amount <= minimum) return res.status(400).json({ message: `Enter a bid greater than ${minimum.toLocaleString("vi-VN")} VND.` });
    const bid = await Bid.create({ listingId: listing._id, bidderId: req.userId, amount });
    listing.pricing.currentBid = amount;
    listing.pricing.bidCount = Number(listing.pricing.bidCount || 0) + 1;
    await listing.save();
    res.status(201).json({ success: true, data: { bid, currentBid: listing.pricing.currentBid, bidCount: listing.pricing.bidCount } });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getBids = async (req, res) => {
  try {
    const bids = await Bid.find({ listingId: req.params.id }).sort({ createdAt: -1 }).limit(20).populate("bidderId", "username");
    res.json({ success: true, data: bids.map((bid) => ({ amount: bid.amount, createdAt: bid.createdAt, bidder: `${bid.bidderId?.username?.slice(0, 2) || "**"}***` })) });
  } catch (error) { res.status(500).json({ message: error.message }); }
};
