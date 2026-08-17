const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Không có token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User không tồn tại" });
    }

    req.userId = user._id.toString();
    req.userRole = user.role; // ← thêm role vào request
    next();
  } catch (error) {
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};
