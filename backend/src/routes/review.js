const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createLimiter } = require("../middleware/rateLimiter");
const {
  createReview,
  getListingReviews,
  getOrderReview,
  getSellerReviewSummary,
  getMySellerReviews,
  respondToReview,
} = require("../controllers/reviewController");

router.post("/", auth, createLimiter, createReview);
router.get("/listing/:listingId", getListingReviews);
router.get("/seller/:sellerId/summary", getSellerReviewSummary);
router.get("/seller/me", auth, getMySellerReviews);
router.get("/order/:orderId", auth, getOrderReview);
router.post("/:reviewId/seller-response", auth, createLimiter, respondToReview);

module.exports = router;
