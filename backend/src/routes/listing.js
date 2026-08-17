const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const role = require("../middleware/role");
const {
  getListings,
  getListing,
  createListing,
} = require("../controllers/listingController");

router.get("/", getListings);
router.get("/:id", getListing);
router.post("/", auth, role("seller"), createListing); // ← chỉ seller
module.exports = router;
