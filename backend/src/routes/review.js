const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createReview,
  getListingReviews,
  getOrderReview,
  getSellerReviewSummary,
  getMySellerReviews,
  respondToReview,
} = require("../controllers/reviewController");

router.post("/", auth, createReview);
router.get("/listing/:listingId", getListingReviews);
router.get("/seller/:sellerId/summary", getSellerReviewSummary);
router.get("/seller/me", auth, getMySellerReviews);
router.get("/order/:orderId", auth, getOrderReview);
router.post("/:reviewId/seller-response", auth, respondToReview);

module.exports = router;
