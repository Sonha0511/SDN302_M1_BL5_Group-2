const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    sellerProfile: {
      storeName: { type: String, default: "" },
      bio: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      businessType: { type: String, default: "Individual" },
      responseTime: { type: String, default: "Within 24 hours" },
      returnPolicy: { type: String, default: "30-day returns" },
      shippingFrom: { type: String, default: "" },
    },
    role: {
      type: String,
      enum: ["buyer", "seller"],
      default: "buyer",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Hash password trước khi save
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});
// Method so sánh password khi login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
