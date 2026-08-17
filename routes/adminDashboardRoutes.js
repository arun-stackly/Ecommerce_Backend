const express = require("express");
const router = express.Router();
const adminDashboard = require("../controllers/adminDashboardController");

router.get("/", adminDashboard.getDashboard);
router.get("/recent-orders", adminDashboard.getRecentOrders);
router.get("/top-products", adminDashboard.getTopProducts);

module.exports = router;