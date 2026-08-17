const Listing = require("../models/Listing");
const { attachSellerReputation } = require("../utils/sellerReputation");

// GET /api/listings - lấy tất cả listings
exports.getListings = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = { status: "active" };

    if (category) filter.categoryId = category;
    if (search) filter.title = { $regex: search, $options: "i" };
    if (minPrice || maxPrice) {
      filter["pricing.fixedPrice"] = {};
      if (minPrice) filter["pricing.fixedPrice"].$gte = Number(minPrice);
      if (maxPrice) filter["pricing.fixedPrice"].$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const total = await Listing.countDocuments(filter);
    const listings = await Listing.find(filter)
      .populate("sellerId", "name username avatar sellerProfile")
      .populate("categoryId", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const listingsWithReputation = await attachSellerReputation(listings);

    res.json({
      listings: listingsWithReputation,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/listings/:id - lấy 1 listing
exports.getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("sellerId", "name username avatar sellerProfile")
      .populate("categoryId", "name slug");

    if (!listing) {
      return res.status(404).json({ message: "Listing không tồn tại" });
    }

    // Tăng view count
    listing.stats.views += 1;
    await listing.save();

    const listingWithReputation = await attachSellerReputation(listing);

    res.json(listingWithReputation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/listings - tạo listing mới (cần auth)
exports.createListing = async (req, res) => {
  try {
    const listing = await Listing.create({
      ...req.body,
      sellerId: req.userId,
    });
    res.status(201).json(listing);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
