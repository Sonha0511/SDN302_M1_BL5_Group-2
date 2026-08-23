const express = require("express");
const router = express.Router();
const disputeController = require("../controllers/disputeController");
const authMiddleware = require("../middleware/auth"); // Đường dẫn tới file auth của nhóm

// Áp dụng authMiddleware cho tất cả các route bên dưới
router.use(authMiddleware);

router.post("/", disputeController.createDispute);
router.get("/", disputeController.getDisputes);
router.patch("/:id", disputeController.updateDisputeStatus);
router.get("/:id", disputeController.getDisputeById);

module.exports = router;