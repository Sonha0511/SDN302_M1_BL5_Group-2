const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  register,
  login,
  getMe,
  becomeSeller,
} = require("../controllers/authController");
const { authLimiter, createLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", auth, getMe);
router.post("/become-seller", auth, createLimiter, becomeSeller);

module.exports = router;
