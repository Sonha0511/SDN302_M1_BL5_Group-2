const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createLimiter } = require("../middleware/rateLimiter");
const {
  createVoucher,
  getSellerVouchers,
  toggleVoucherStatus,
  deleteVoucher,
  getListingVouchers,
  validateVoucher,
} = require("../controllers/voucherController");

// Middleware check seller role
const isSeller = (req, res, next) => {
  if (req.userRole !== "seller") {
    return res
      .status(403)
      .json({ success: false, message: "Access denied. Sellers only." });
  }
  next();
};

// Public route to get vouchers for a product and validate at checkout
router.get("/listing/:listingId", getListingVouchers);
router.post("/validate", createLimiter, validateVoucher);

// Protected routes
router.use(auth);

// Seller voucher management routes
router.use(isSeller);
router.post("/", createLimiter, createVoucher);
router.get("/seller", getSellerVouchers);
router.patch("/:id/toggle", createLimiter, toggleVoucherStatus);
router.delete("/:id", createLimiter, deleteVoucher);

module.exports = router;
