const mongoose = require("mongoose");
const Review = require("../models/Review");

const buildReputation = (stats = {}) => {
  const totalReviews = stats.totalReviews || 0;
  const positiveReviews = stats.positiveReviews || 0;
  const averageRating = stats.averageRating || 0;
  const detailedRatings = stats.detailedRatings || {};
  const positiveFeedbackPercent = totalReviews
    ? Math.round((positiveReviews / totalReviews) * 100)
    : 0;

  let badge = "";
  if (totalReviews >= 5 && positiveFeedbackPercent >= 95) {
    badge = "Top Rated Seller";
  } else if (totalReviews >= 3 && positiveFeedbackPercent >= 80) {
    badge = "Trusted Seller";
  }

  return {
    positiveFeedbackPercent,
    positiveReviews,
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10,
    detailedRatings: {
      itemDescription: Math.round((detailedRatings.itemDescription || 0) * 10) / 10,
      communication: Math.round((detailedRatings.communication || 0) * 10) / 10,
      shippingTime: Math.round((detailedRatings.shippingTime || 0) * 10) / 10,
      shippingCost: Math.round((detailedRatings.shippingCost || 0) * 10) / 10,
    },
    badge,
  };
};

const aggregateSellerReputation = async (sellerIds) => {
  const ids = [...new Set(sellerIds.filter(Boolean).map(String))]
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (!ids.length) return new Map();

  const stats = await Review.aggregate([
    { $match: { sellerId: { $in: ids } } },
    {
      $group: {
        _id: "$sellerId",
        totalReviews: { $sum: 1 },
        positiveReviews: {
          $sum: { $cond: [{ $eq: ["$feedbackType", "positive"] }, 1, 0] },
        },
        averageRating: { $avg: "$rating" },
        itemDescription: { $avg: "$detailedRatings.itemDescription" },
        communication: { $avg: "$detailedRatings.communication" },
        shippingTime: { $avg: "$detailedRatings.shippingTime" },
        shippingCost: { $avg: "$detailedRatings.shippingCost" },
      },
    },
  ]);

  return new Map(
    stats.map((item) => [
      item._id.toString(),
      buildReputation({
        ...item,
        detailedRatings: {
          itemDescription: item.itemDescription,
          communication: item.communication,
          shippingTime: item.shippingTime,
          shippingCost: item.shippingCost,
        },
      }),
    ]),
  );
};

const getSellerReputation = async (sellerId) => {
  const reputationBySeller = await aggregateSellerReputation([sellerId]);
  return reputationBySeller.get(String(sellerId)) || buildReputation();
};

const attachSellerReputation = async (listings) => {
  const list = Array.isArray(listings) ? listings : [listings];
  const reputationBySeller = await aggregateSellerReputation(
    list.map((listing) => listing.sellerId?._id || listing.sellerId),
  );

  const withReputation = list.map((listing) => {
    const plainListing = listing.toObject ? listing.toObject() : listing;
    const sellerId = plainListing.sellerId?._id || plainListing.sellerId;
    return {
      ...plainListing,
      sellerReputation:
        reputationBySeller.get(String(sellerId)) || buildReputation(),
    };
  });

  return Array.isArray(listings) ? withReputation : withReputation[0];
};

module.exports = {
  attachSellerReputation,
  buildReputation,
  getSellerReputation,
};
