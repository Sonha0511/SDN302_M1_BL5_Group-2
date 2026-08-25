const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { createLimiter } = require("../middleware/rateLimiter");
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrder,
  updateOrderStatus,
  confirmOrder,
  cancelOrder,
} = require("../controllers/orderController");

router.post("/", auth, createLimiter, createOrder);
router.get("/my", auth, getMyOrders);
router.get("/seller", auth, getSellerOrders);
router.get("/:id", auth, getOrder);
router.patch("/:id/status", auth, createLimiter, updateOrderStatus);
router.patch("/:id/confirm", auth, createLimiter, confirmOrder);
router.patch("/:id/cancel", auth, createLimiter, cancelOrder);

module.exports = router;
