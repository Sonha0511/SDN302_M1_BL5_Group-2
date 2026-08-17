const { cloudinary } = require("../config/cloudinary");

// POST /api/upload/image - upload 1 ảnh
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }
    res.json({
      url: req.file.path,
      publicId: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/upload/images - upload nhiều ảnh
exports.uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Không có file nào được upload" });
    }
    const urls = req.files.map((file) => ({
      url: file.path,
      publicId: file.filename,
    }));
    res.json({ urls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/upload/image/:publicId - xóa ảnh
exports.deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: "Đã xóa ảnh" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
