const Voucher = require("../models/Voucher");
const Listing = require("../models/Listing");

// 1. Seller tạo mã giảm giá cho sản phẩm của mình
exports.createVoucher = async (req, res) => {
  try {
    const { code, listingId, eligibleScope = "selected", eligibleListingIds = [], visibility = "public", campaignName, description, maxUsesPerBuyer, campaignBudget, discountType, discountValue, minOrderValue, maxDiscountAmount, usageLimit, startDate, endDate } = req.body;
    const userId = req.user?.id || req.user?._id || req.userId;

    if (!code || !discountType || !discountValue || !endDate || (eligibleScope === "selected" && !listingId && !eligibleListingIds.length)) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Kiểm tra sản phẩm có tồn tại và thuộc về seller này không
    const selectedIds = eligibleListingIds.length ? eligibleListingIds : (listingId ? [listingId] : []);
    const ownedCount = selectedIds.length ? await Listing.countDocuments({ _id: { $in: selectedIds }, sellerId: userId }) : 0;
    if ((eligibleScope === "selected" && ownedCount !== selectedIds.length) || (eligibleScope === "all" && !await Listing.exists({ sellerId: userId }))) {
      return res.status(404).json({ success: false, message: "Product not found or you do not have permission to create voucher for it." });
    }

    // Kiểm tra code trùng lặp toàn hệ thống
    const normalizedCode = code.trim().toUpperCase();
    const startsAt = new Date(startDate || Date.now());
    const endsAt = new Date(endDate);
    if (!/^[A-Z0-9_-]{3,20}$/.test(normalizedCode) || !["percentage", "fixed"].includes(discountType) || Number(discountValue) <= 0 || (discountType === "percentage" && Number(discountValue) > 100) || startsAt >= endsAt || (usageLimit && Number(usageLimit) < 1) || (maxUsesPerBuyer && Number(maxUsesPerBuyer) < 1) || Number(campaignBudget || 0) < 0) {
      return res.status(400).json({ success: false, message: "Please check coupon code, discount, limits, budget and campaign dates." });
    }
    const existingVoucher = await Voucher.findOne({ code: normalizedCode });
    if (existingVoucher) {
      return res.status(400).json({ success: false, message: "Voucher code already exists. Please choose a different code." });
    }

    const newVoucher = new Voucher({
      code: normalizedCode,
      sellerId: userId,
      listingId: selectedIds[0],
      eligibleScope,
      eligibleListingIds: selectedIds,
      visibility,
      campaignName,
      description,
      maxUsesPerBuyer: maxUsesPerBuyer ? Number(maxUsesPerBuyer) : null,
      campaignBudget: Number(campaignBudget) || 0,
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
    const listing = await Listing.findById(listingId).select("sellerId");
    if (!listing) return res.status(404).json({ success: false, message: "Listing not found." });
    const vouchers = await Voucher.find({
      visibility: "public",
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $and: [
        { $or: [{ usageLimit: null }, { $expr: { $lt: ["$usedCount", "$usageLimit"] } }] },
        { $or: [{ eligibleScope: "all", sellerId: listing.sellerId }, { eligibleScope: "selected", eligibleListingIds: listingId }, { eligibleScope: "selected", listingId }] }
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

    const listing = await Listing.findById(listingId).select("sellerId");
    const eligible = voucher.eligibleScope === "all" ? String(voucher.sellerId) === String(listing?.sellerId) : voucher.eligibleListingIds?.some((id) => String(id) === String(listingId)) || String(voucher.listingId) === String(listingId);
    if (!eligible) {
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
