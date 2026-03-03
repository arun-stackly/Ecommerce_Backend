const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // seller middleware
const { protectUser } = require("../middleware/userAuthMiddleware"); // customer middleware

const userOrderController = require("../controllers/userorderController");


// Customer routes (must use protectUser)
router.post("/create-order", protectUser, userOrderController.createOrder);
router.get("/", protectUser, userOrderController.getOrders);
router.get("/:id", protectUser, userOrderController.getSingleOrder);

// Admin/Seller routes (must use protect)
router.patch("/:id/status", protect, userOrderController.updateOrderStatus);

module.exports = router;