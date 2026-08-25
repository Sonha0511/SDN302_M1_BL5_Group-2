const express = require("express");
const router = express.Router();
const disputeController = require("../controllers/disputeController");
const { createLimiter } = require("../middleware/rateLimiter");
const authMiddleware = require("../middleware/auth"); // Đường dẫn tới file auth của nhóm

// Áp dụng authMiddleware cho tất cả các route bên dưới
router.use(authMiddleware);

router.post("/", createLimiter, disputeController.createDispute);
router.get("/", disputeController.getDisputes);
router.patch("/:id", createLimiter, disputeController.updateDisputeStatus);
router.get("/:id", disputeController.getDisputeById);

module.exports = router;
