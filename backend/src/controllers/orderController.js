const Order = require("../models/Order");
const Listing = require("../models/Listing");
const Voucher = require("../models/Voucher");

// POST /api/orders - tạo đơn hàng
exports.createOrder = async (req, res) => {
  try {
    const { listingId, quantity, shippingAddress, paymentMethod, voucherCode } = req.body;

    const listing = await Listing.findById(listingId);
    if (!listing)
      return res.status(404).json({ message: "Listing không tồn tại" });
    if (listing.totalQuantity < quantity) {
      return res.status(400).json({ message: "Không đủ hàng" });
    }

    if (listing.sellerId.toString() === req.userId) {
      return res
        .status(403)
        .json({ message: "Bạn không thể mua hàng của chính mình" });
    }

    const itemPrice = listing.pricing.fixedPrice;
    const subtotal = itemPrice * quantity;
    const shippingCost = 30000;

    let discountAmount = 0;
    let appliedVoucherId = null;

    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode.toUpperCase(), isActive: true });
      if (!voucher) {
        return res.status(400).json({ message: "Mã giảm giá không tồn tại hoặc đã hết hạn" });
      }
      if (String(voucher.listingId) !== String(listingId)) {
        return res.status(400).json({ message: "Mã giảm giá không áp dụng cho sản phẩm này" });
      }
      const now = new Date();
      if (voucher.startDate > now || voucher.endDate < now) {
        return res.status(400).json({ message: "Mã giảm giá đã hết hạn hoặc chưa kích hoạt" });
      }
      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
        return res.status(400).json({ message: "Mã giảm giá đã hết lượt sử dụng" });
      }
      if (subtotal < voucher.minOrderValue) {
        return res.status(400).json({ 
          message: `Mã giảm giá yêu cầu giá trị đơn hàng tối thiểu ₫${voucher.minOrderValue.toLocaleString("vi-VN")}` 
        });
      }

      if (voucher.discountType === "fixed") {
        discountAmount = voucher.discountValue;
      } else if (voucher.discountType === "percentage") {
        discountAmount = (subtotal * voucher.discountValue) / 100;
        if (voucher.maxDiscountAmount > 0 && discountAmount > voucher.maxDiscountAmount) {
          discountAmount = voucher.maxDiscountAmount;
        }
      }

      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }

      appliedVoucherId = voucher._id;

      // Cập nhật số lượng đã sử dụng
      voucher.usedCount += 1;
      await voucher.save();
    }

    const total = subtotal + shippingCost - discountAmount;

    const order = await Order.create({
      buyerId: req.userId,
      sellerId: listing.sellerId,
      listingId,
      listingTitle: listing.title,
      listingImage: listing.images?.[0] || "",
      quantity,
      pricing: {
        itemPrice,
        quantity,
        subtotal,
        shippingCost,
        total,
        currency: "VND",
      },
      shippingAddress,
      paymentMethod,
      status: "awaiting_shipment",
      paymentStatus: paymentMethod === "COD" ? "pending" : "paid",
      appliedVoucher: appliedVoucherId,
      discountAmount,
    });

    listing.totalQuantity -= quantity;
    await listing.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/my - lấy đơn hàng của buyer
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyerId: req.userId })
      .populate("listingId", "title images pricing")
      .populate("sellerId", "name username")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/seller - lấy đơn hàng của seller
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ sellerId: req.userId })
      .populate("listingId", "title images pricing")
      .populate("buyerId", "name username")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/orders/:id - lấy chi tiết 1 đơn hàng
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("listingId", "title images pricing")
      .populate("sellerId", "name username")
      .populate("buyerId", "name username");

    if (!order) return res.status(404).json({ message: "Order không tồn tại" });

    if (
      order.buyerId._id.toString() !== req.userId &&
      order.sellerId._id.toString() !== req.userId
    ) {
      return res.status(403).json({ message: "Không có quyền xem order này" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/orders/:id/status - cập nhật trạng thái (seller)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order không tồn tại" });
    if (order.sellerId.toString() !== req.userId) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    order.status = status;
    if (status === "delivered") order.paymentStatus = "paid";
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/orders/:id/cancel - hủy đơn (buyer)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order không tồn tại" });
    if (order.buyerId.toString() !== req.userId) {
      return res.status(403).json({ message: "Không có quyền" });
    }

    // Fix: cho phép cancel cả awaiting_shipment
    const cancellableStatuses = [
      "pending",
      "awaiting_payment",
      "awaiting_shipment",
    ];
    if (!cancellableStatuses.includes(order.status)) {
      return res
        .status(400)
        .json({ message: "Không thể hủy đơn ở trạng thái này" });
    }

    order.status = "cancelled";

    // Hoàn lại tồn kho
    const listing = await Listing.findById(order.listingId);
    if (listing) {
      listing.totalQuantity += order.quantity;
      await listing.save();
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
