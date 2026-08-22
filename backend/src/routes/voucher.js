const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createVoucher,
  getSellerVouchers,
  deleteVoucher,
  getListingVouchers,
  validateVoucher,
} = require("../controllers/voucherController");

// Middleware check seller role
const isSeller = (req, res, next) => {
  if (req.userRole !== "seller") {
    return res.status(403).json({ success: false, message: "Access denied. Sellers only." });
  }
  next();
};

// Public route to get vouchers for a product and validate at checkout
router.get("/listing/:listingId", getListingVouchers);
router.post("/validate", validateVoucher);

// Protected routes
router.use(auth);

// Seller voucher management routes
router.use(isSeller);
router.post("/", createVoucher);
router.get("/seller", getSellerVouchers);
router.delete("/:id", deleteVoucher);

module.exports = router;
