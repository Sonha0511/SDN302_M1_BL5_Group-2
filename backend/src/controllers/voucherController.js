const Voucher = require("../models/Voucher");
const Listing = require("../models/Listing");

// 1. Seller tạo mã giảm giá cho sản phẩm của mình
exports.createVoucher = async (req, res) => {
  try {
    const { code, listingId, discountType, discountValue, minOrderValue, maxDiscountAmount, usageLimit, startDate, endDate } = req.body;
    const userId = req.user?.id || req.user?._id || req.userId;

    if (!code || !listingId || !discountType || !discountValue || !endDate) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Kiểm tra sản phẩm có tồn tại và thuộc về seller này không
    const listing = await Listing.findOne({ _id: listingId, sellerId: userId });
    if (!listing) {
      return res.status(404).json({ success: false, message: "Product not found or you do not have permission to create voucher for it." });
    }

    // Kiểm tra code trùng lặp toàn hệ thống
    const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (existingVoucher) {
      return res.status(400).json({ success: false, message: "Voucher code already exists. Please choose a different code." });
    }

    const newVoucher = new Voucher({
      code: code.toUpperCase(),
      sellerId: userId,
      listingId,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: new Date(endDate),
    });

    await newVoucher.save();
    return res.status(201).json({ success: true, data: newVoucher });
  } catch (error) {
    console.error("🔥 Error in createVoucher:", error.message);
    return res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// 2. Seller lấy danh sách mã giảm giá của mình
exports.getSellerVouchers = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    const vouchers = await Voucher.find({ sellerId: userId }).populate("listingId", "title images pricing");
    return res.status(200).json({ success: true, data: vouchers });
  } catch (error) {
    console.error("🔥 Error in getSellerVouchers:", error.message);
    return res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// 3. Seller Pause/Resume (Tạm dừng / Kích hoạt lại) mã giảm giá chuẩn theo eBay
exports.toggleVoucherStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id || req.userId;

    const voucher = await Voucher.findOne({ _id: id, sellerId: userId });
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found or access denied." });
    }

    voucher.isActive = !voucher.isActive;
    await voucher.save();
    return res.status(200).json({ 
      success: true, 
      data: voucher, 
      message: `Voucher is now ${voucher.isActive ? "Active" : "Paused"}.` 
    });
  } catch (error) {
    console.error("🔥 Error in toggleVoucherStatus:", error.message);
    return res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// 4. Seller xóa mã giảm giá
exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id || req.userId;

    const voucher = await Voucher.findOneAndDelete({ _id: id, sellerId: userId });
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found or you do not have permission to delete it." });
    }

    return res.status(200).json({ success: true, message: "Voucher deleted successfully." });
  } catch (error) {
    console.error("🔥 Error in deleteVoucher:", error.message);
    return res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// 4. Buyer lấy danh sách mã giảm giá cho sản phẩm cụ thể
exports.getListingVouchers = async (req, res) => {
  try {
    const { listingId } = req.params;
    const now = new Date();
    
    // Tìm các voucher còn hạn, chưa dùng hết lượt và đang hoạt động cho sản phẩm này
    const vouchers = await Voucher.find({
      listingId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
      ]
    }).select("code discountType discountValue minOrderValue maxDiscountAmount endDate");

    return res.status(200).json({ success: true, data: vouchers });
  } catch (error) {
    console.error("🔥 Error in getListingVouchers:", error.message);
    return res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};

// 5. Kiểm tra tính hợp lệ của mã giảm giá khi buyer checkout
exports.validateVoucher = async (req, res) => {
  try {
    const { code, listingId, subtotal } = req.body;
    if (!code || !listingId || subtotal === undefined) {
      return res.status(400).json({ success: false, message: "Missing code, listingId, or subtotal." });
    }

    const voucher = await Voucher.findOne({ code: code.toUpperCase(), isActive: true });
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher code is invalid or has expired." });
    }

    if (String(voucher.listingId) !== String(listingId)) {
      return res.status(400).json({ success: false, message: "Voucher code cannot be applied to this product." });
    }

    const now = new Date();
    if (voucher.startDate > now || voucher.endDate < now) {
      return res.status(400).json({ success: false, message: "Voucher code has expired or is not active yet." });
    }

    if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ success: false, message: "Voucher usage limit has been reached." });
    }

    if (subtotal < voucher.minOrderValue) {
      return res.status(400).json({ 
        success: false, 
        message: `This voucher requires a minimum order subtotal of ₫${voucher.minOrderValue.toLocaleString("vi-VN")}.` 
      });
    }

    // Tính toán số tiền được giảm
    let discountAmount = 0;
    if (voucher.discountType === "fixed") {
      discountAmount = voucher.discountValue;
    } else if (voucher.discountType === "percentage") {
      discountAmount = (subtotal * voucher.discountValue) / 100;
      if (voucher.maxDiscountAmount > 0 && discountAmount > voucher.maxDiscountAmount) {
        discountAmount = voucher.maxDiscountAmount;
      }
    }

    // Đảm bảo không giảm nhiều hơn tổng tiền hàng
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return res.status(200).json({
      success: true,
      message: "Voucher applied successfully.",
      data: {
        code: voucher.code,
        voucherId: voucher._id,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        discountAmount,
      }
    });
  } catch (error) {
    console.error("🔥 Error in validateVoucher:", error.message);
    return res.status(500).json({ success: false, message: "Server Error: " + error.message });
  }
};
