const express = require("express");

const router = express.Router();

const {
  getOrderStats,
  getAdminOrders,
  searchOrderById,
  getOrdersByStatusWithItems,
} = require("../controllers/adminOrderController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
// Dashboard statistics
router.get("/stats",adminAuthMiddleware, getOrderStats);

// Orders list
router.get("/",adminAuthMiddleware, getAdminOrders);

// Search by order ID
router.get("/search/:orderId", adminAuthMiddleware, searchOrderById);

// Orders by status
router.get("/status/:status",adminAuthMiddleware, getOrdersByStatusWithItems);
module.exports = router;
