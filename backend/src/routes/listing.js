const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const { createLimiter } = require("../middleware/rateLimiter");
const {
  getListings,
  getListing,
  createListing,
} = require("../controllers/listingController");
const { placeBid, getBids } = require("../controllers/bidController");

router.get("/", getListings);
router.get("/:id", getListing);
router.get("/:id/bids", getBids);
router.post("/:id/bids", auth, createLimiter, placeBid);
router.post("/", auth, role("seller"), createLimiter, createListing); // ← chỉ seller
module.exports = router;
