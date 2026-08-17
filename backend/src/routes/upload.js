const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const {
  uploadImage,
  uploadImages,
  deleteImage,
} = require("../controllers/uploadController");

// Upload 1 ảnh
router.post("/image", auth, upload.single("image"), uploadImage);

// Upload nhiều ảnh (tối đa 5)
router.post("/images", auth, upload.array("images", 5), uploadImages);

// Xóa ảnh
router.delete("/image/:publicId", auth, deleteImage);

module.exports = router;
