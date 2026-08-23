const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { email, password, name, username, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already exists" });
    }

    const user = await User.create({ email, password, name, username, role });
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/become-seller
exports.becomeSeller = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = "seller";
    if (!user.sellerProfile || !user.sellerProfile.storeName) {
      user.sellerProfile = {
        ...user.sellerProfile,
        storeName: req.body.storeName?.trim() || `${user.name}'s Store`,
        bio: req.body.bio?.trim() || "Welcome to my store on eBay!",
        phone: req.body.phone?.trim() || "",
        location: req.body.location?.trim() || "Vietnam",
        businessType: req.body.businessType || "Individual",
        responseTime: "Within 24 hours",
        returnPolicy: "30-day returns",
        shippingFrom: req.body.shippingFrom?.trim() || "Vietnam",
      };
    }

    await user.save();
    const token = generateToken(user._id);

    return res.json({
      success: true,
      message: "Congratulations! You have successfully registered your eBay Seller account.",
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        sellerProfile: user.sellerProfile,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
