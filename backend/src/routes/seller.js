const express = require("express");
const router = express.Router();
const sellerController = require("../controllers/sellerController.js");
const { upload } = require("../config/cloudinary.js"); 
const authMiddleware = require("../middleware/auth.js");

router.get("/:id/profile", sellerController.getSellerProfile);

router.use(authMiddleware);
router.patch("/profile", (req, res, next) => {
  upload.single("avatar")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Unable to upload avatar",
      });
    }
    next();
  });
}, sellerController.updateSellerProfile);

// 1. API Lấy danh sách sản phẩm
router.get("/listings", sellerController.getSellerListings);

// 2. API Đăng sản phẩm - ĐÃ BỌC HÀM XỬ LÝ LỖI MULTER / CLOUDINARY TRỰC TIẾP
router.post("/listings", (req, res, next) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) {
      console.log("\n🔥 [Error detected when uploading images to Cloudinary]:");
      console.error("👉 Detailed error notification:", err.message || err);
      
      // Trả về thẳng lỗi cho Frontend thay vì làm treo server
      return res.status(400).json({ 
        success: false, 
        message: "Error uploading image configuration to Cloudinary: " + (err.message || "Please check your .env file") 
      });
    }
    // Nếu không có lỗi ảnh, chạy tiếp sang controller để lưu database
    next();
  });
}, sellerController.createListing); 

// 3. API Cập nhật sản phẩm
router.put("/listings/:id", upload.array("images", 5), sellerController.updateListing);

// 4. API Xóa sản phẩm
router.delete("/listings/:id", sellerController.deleteListing);

// 5. Các API Đơn hàng
router.get("/orders", sellerController.getSellerOrders);
router.patch("/orders/:id/status", sellerController.updateOrderStatus);
router.patch("/listings/:id/toggle", sellerController.toggleListingStatus);
module.exports = router;
