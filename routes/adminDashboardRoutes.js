const express = require("express");
const router = express.Router();
const adminDashboard = require("../controllers/adminDashboardController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

router.get("/", adminAuthMiddleware, adminDashboard.getDashboard);
router.get("/recent-orders",adminAuthMiddleware, adminDashboard.getRecentOrders);
router.get("/top-products",adminAuthMiddleware, adminDashboard.getTopProducts);
router.get("/top-categories",adminAuthMiddleware, adminDashboard.getTopCategories);
module.exports = router;