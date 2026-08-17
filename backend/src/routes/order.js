const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  createOrder,
  getMyOrders,
  getSellerOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");

router.post("/", auth, createOrder);
router.get("/my", auth, getMyOrders);
router.get("/seller", auth, getSellerOrders);
router.get("/:id", auth, getOrder);
router.patch("/:id/status", auth, updateOrderStatus);
router.patch("/:id/cancel", auth, cancelOrder);

module.exports = router;
