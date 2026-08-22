const Listing = require("../models/Listing");
const Order = require("../models/Order");
const mongoose = require("mongoose");
const User = require("../models/User");
const Review = require("../models/Review");
const {
  attachSellerReputation,
  getSellerReputation,
} = require("../utils/sellerReputation");

exports.getSellerProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid seller id" });
    }

    const seller = await User.findOne({
      _id: req.params.id,
      role: "seller",
      isActive: true,
    }).select("name username avatar sellerProfile createdAt");

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const [reputation, listings, reviews] = await Promise.all([
      getSellerReputation(seller._id),
      Listing.find({ sellerId: seller._id, status: "active" })
        .populate("sellerId", "name username avatar")
        .sort({ createdAt: -1 }),
      Review.find({ sellerId: seller._id })
        .populate("buyerId", "name username avatar")
        .populate("listingId", "title images")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    const listingsWithReputation = await attachSellerReputation(listings);

    return res.json({
      success: true,
      data: {
        seller,
        reputation,
        listings: listingsWithReputation,
        reviews,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSellerProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      name,
      username,
      avatar,
      storeName,
      bio,
      phone,
      location,
      businessType,
      responseTime,
      returnPolicy,
      shippingFrom,
    } = req.body;

    const seller = await User.findOne({ _id: userId, role: "seller" });
    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    const nextUsername = username?.trim();
    if (nextUsername && nextUsername !== seller.username) {
      const existingUser = await User.findOne({
        username: nextUsername,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Username already exists" });
      }
      seller.username = nextUsername;
    }

    if (name?.trim()) seller.name = name.trim();
    if (req.file?.path) {
      seller.avatar = req.file.path;
    } else if (typeof avatar === "string") {
      seller.avatar = avatar.trim();
    }

    seller.sellerProfile = {
      ...seller.sellerProfile,
      storeName: storeName?.trim() || seller.sellerProfile?.storeName || "",
      bio: bio?.trim() || seller.sellerProfile?.bio || "",
      phone: phone?.trim() || seller.sellerProfile?.phone || "",
      location: location?.trim() || seller.sellerProfile?.location || "",
      businessType:
        businessType?.trim() ||
        seller.sellerProfile?.businessType ||
        "Individual",
      responseTime:
        responseTime?.trim() ||
        seller.sellerProfile?.responseTime ||
        "Within 24 hours",
      returnPolicy:
        returnPolicy?.trim() ||
        seller.sellerProfile?.returnPolicy ||
        "30-day returns",
      shippingFrom:
        shippingFrom?.trim() || seller.sellerProfile?.shippingFrom || "",
    };

    await seller.save();

    return res.json({
      success: true,
      data: {
        _id: seller._id,
        email: seller.email,
        name: seller.name,
        username: seller.username,
        role: seller.role,
        avatar: seller.avatar,
        sellerProfile: seller.sellerProfile,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 1. Get listings belonging to the logged-in seller
exports.getSellerListings = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Seller information not found. Please log in again!",
        });
    }

    const listings = await Listing.find({ sellerId: userId });
    return res.status(200).json({ success: true, data: listings });
  } catch (error) {
    console.error("🔥 Error in getSellerListings:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};

// 2. Create a new product listing
exports.createListing = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description,
      condition,
      fixedPrice,
      totalQuantity,
    } = req.body;
    const userId = req.user?.id || req.user?._id || req.userId;

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(
        (file) => file.path || file.url || file.location,
      );
    }

    const parsedPrice = parseFloat(fixedPrice) || 0;
    const parsedQuantity = parseInt(totalQuantity, 10) || 1;

    const newListing = new Listing({
      sellerId: userId,
      title: title || "Untitled Product",
      subtitle: subtitle || "",
      description: description || "",
      condition: condition || "new",
      images: imageUrls,
      pricing: {
        currency: "VND",
        fixedPrice: parsedPrice,
      },
      totalQuantity: parsedQuantity,
      status: "active",
    });

    await newListing.save();
    return res.status(201).json({ success: true, data: newListing });
  } catch (error) {
    console.error(
      "🔥 Detailed error in createListing:",
      JSON.stringify(error, null, 2),
    );
    return res
      .status(400)
      .json({
        success: false,
        message: "Unable to publish listing: " + error.message,
      });
  }
};

// 3. Update an existing product listing
exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      description,
      condition,
      fixedPrice,
      totalQuantity,
      status,
    } = req.body;
    const userId = req.user?.id || req.user?._id || req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({
          success: false,
          message: "Session expired. Please log in again!",
        });
    }

    const listing = await Listing.findOne({ _id: id, sellerId: userId });
    if (!listing) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Product not found or you do not have permission to edit this item!",
        });
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path || file.url);
      listing.images = [...listing.images, ...newImages];
    }

    if (title) listing.title = title;
    if (subtitle) listing.subtitle = subtitle;
    if (description) listing.description = description;
    if (condition) listing.condition = condition;
    if (status) listing.status = status;
    if (totalQuantity) listing.totalQuantity = Number(totalQuantity);

    if (fixedPrice) {
      if (!listing.pricing) listing.pricing = { currency: "VND" };
      listing.pricing.fixedPrice = Number(fixedPrice);
    }

    await listing.save();
    return res.status(200).json({ success: true, data: listing });
  } catch (error) {
    console.error("🔥 Error in updateListing:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};

// 4. Delete a product listing
exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id || req.userId;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Session expired!" });
    }

    const deleted = await Listing.findOneAndDelete({
      _id: id,
      sellerId: userId,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found for deletion!" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Product deleted successfully!" });
  } catch (error) {
    console.error("🔥 Error in deleteListing:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};

// 5. Get orders received by the seller
exports.getSellerOrders = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    const orders = await Order.find({ sellerId: userId });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("🔥 Error in getSellerOrders:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};

// 6. Update order fulfillment status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const nextStatus = status === "delivery_failed" ? "cancelled" : status;
    const userId = req.user?.id || req.user?._id || req.userId;

    const order = await Order.findOne({ _id: id, sellerId: userId });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found!" });
    }

    if (!order.sellerConfirmed) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Seller must confirm the order first!",
        });
    }
    if (
      ["delivered", "delivery_failed", "cancelled", "returned"].includes(
        order.status,
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "This order is complete and cannot move back to another status.",
        });
    }
    const allowedTransitions = {
      pending: ["awaiting_payment", "awaiting_shipment", "cancelled"],
      awaiting_payment: ["awaiting_shipment", "cancelled"],
      awaiting_shipment: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
    };
    if (!allowedTransitions[order.status]?.includes(nextStatus)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid next order status!" });
    }

    order.status = nextStatus;
    await order.save();
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("🔥 Error in updateOrderStatus:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};

// 7. Confirm order before fulfillment actions
exports.confirmOrder = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.userId;
    const order = await Order.findOne({ _id: req.params.id, sellerId: userId });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found!" });
    if (order.sellerConfirmed)
      return res
        .status(400)
        .json({ success: false, message: "Order already confirmed!" });
    if (
      ["delivered", "delivery_failed", "cancelled", "returned"].includes(
        order.status,
      )
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "A completed order cannot be confirmed.",
        });
    }

    order.sellerConfirmed = true;
    order.sellerConfirmedAt = new Date();
    await order.save();
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error confirming order:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Unable to confirm order." });
  }
};
// 8. Toggle Hide/Show listing (Ẩn / Hiện sản phẩm)
exports.toggleListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id || req.userId;

    const listing = await Listing.findOne({ _id: id, sellerId: userId });
    if (!listing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found!" });
    }

    // Nếu đang active thì ẩn thành inactive, và ngược lại
    listing.status = listing.status === "active" ? "inactive" : "active";
    await listing.save();

    return res.status(200).json({
      success: true,
      message: `Product is now ${listing.status}!`,
      status: listing.status,
    });
  } catch (error) {
    console.error("🔥 Error in toggleListingStatus:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Server Error: " + error.message });
  }
};
