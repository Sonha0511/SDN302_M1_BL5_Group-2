const mongoose = require("mongoose");
const Review = require("../models/Review");
const Order = require("../models/Order");
const Listing = require("../models/Listing");

const DETAIL_KEYS = [
  "itemDescription",
  "communication",
  "shippingTime",
  "shippingCost",
];

const updateListingRating = async (listingId) => {
  const stats = await Review.aggregate([
    { $match: { listingId: new mongoose.Types.ObjectId(listingId) } },
    {
      $group: {
        _id: "$listingId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const ratingStats = stats[0] || { averageRating: 0, reviewCount: 0 };

  await Listing.findByIdAndUpdate(listingId, {
    "reviews.averageRating": Math.round(ratingStats.averageRating * 10) / 10,
    "reviews.reviewCount": ratingStats.reviewCount,
  });
};

const normalizeDetailedRatings = (detailedRatings = {}) => {
  const normalized = {};

  for (const key of DETAIL_KEYS) {
    const value = Number(detailedRatings[key]);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      return null;
    }
    normalized[key] = value;
  }

  return normalized;
};

exports.createReview = async (req, res) => {
  try {
    const {
      orderId,
      rating,
      comment,
      feedbackType = "positive",
      detailedRatings = {},
      images = [],
    } = req.body;
    const numericRating = Number(rating);
    const normalizedDetails = normalizeDetailedRatings(detailedRatings);

    if (!orderId) {
      return res.status(400).json({ message: "Please choose an order" });
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be from 1 to 5 stars" });
    }
    if (!["positive", "neutral", "negative"].includes(feedbackType)) {
      return res.status(400).json({ message: "Invalid feedback type" });
    }
    if (!normalizedDetails) {
      return res
        .status(400)
        .json({ message: "Detailed seller ratings must be from 1 to 5 stars" });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: "Please enter your feedback" });
    }
    if (comment.trim().length > 1000) {
      return res.status(400).json({ message: "Feedback is limited to 1000 characters" });
    }
    if (images.length > 5) {
      return res.status(400).json({ message: "You can add up to 5 images" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.buyerId.toString() !== req.userId) {
      return res.status(403).json({ message: "You cannot review this order" });
    }
    if (order.status !== "delivered") {
      return res
        .status(400)
        .json({ message: "You can leave feedback after the order is delivered" });
    }
    if (order.isReviewed) {
      return res.status(400).json({ message: "Feedback has already been left" });
    }

    const review = await Review.create({
      orderId: order._id,
      listingId: order.listingId,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      rating: numericRating,
      feedbackType,
      detailedRatings: normalizedDetails,
      comment: comment.trim(),
      images,
      isVerifiedPurchase: true,
    });

    order.isReviewed = true;
    await order.save();
    await updateListingRating(order.listingId);

    const populatedReview = await Review.findById(review._id)
      .populate("buyerId", "name username avatar")
      .populate("listingId", "title images");

    res.status(201).json(populatedReview);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Feedback has already been left" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getListingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ listingId: req.params.listingId })
      .populate("buyerId", "name username avatar")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderReview = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (
      order.buyerId.toString() !== req.userId &&
      order.sellerId.toString() !== req.userId
    ) {
      return res.status(403).json({ message: "You cannot view this feedback" });
    }

    const review = await Review.findOne({ orderId: req.params.orderId })
      .populate("buyerId", "name username avatar")
      .populate("listingId", "title images");

    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSellerReviewSummary = async (req, res) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.sellerId });
    const reviewCount = reviews.length;
    const positiveCount = reviews.filter(
      (review) => review.feedbackType === "positive",
    ).length;
    const neutralCount = reviews.filter(
      (review) => review.feedbackType === "neutral",
    ).length;
    const negativeCount = reviews.filter(
      (review) => review.feedbackType === "negative",
    ).length;

    const averageDetail = (key) => {
      const values = reviews
        .map((review) => review.detailedRatings?.[key])
        .filter(Boolean);
      if (!values.length) return 0;
      return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
    };

    res.json({
      reviewCount,
      positiveCount,
      neutralCount,
      negativeCount,
      positivePercentage: reviewCount
        ? Math.round((positiveCount / reviewCount) * 1000) / 10
        : 0,
      detailedRatings: {
        itemDescription: averageDetail("itemDescription"),
        communication: averageDetail("communication"),
        shippingTime: averageDetail("shippingTime"),
        shippingCost: averageDetail("shippingCost"),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
