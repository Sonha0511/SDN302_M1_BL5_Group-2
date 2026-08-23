const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createReview,
  getListingReviews,
  getOrderReview,
  getSellerReviewSummary,
} = require("../controllers/reviewController");

router.post("/", auth, createReview);
router.get("/listing/:listingId", getListingReviews);
router.get("/seller/:sellerId/summary", getSellerReviewSummary);
router.get("/order/:orderId", auth, getOrderReview);

module.exports = router;
