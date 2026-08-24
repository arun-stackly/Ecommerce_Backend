const express = require("express");

const router = express.Router();

const {
  getCouponStats,
  getAdminCoupons,
} = require("../controllers/adminCouponController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
// ==========================================
// ADMIN COUPON DASHBOARD
// ==========================================

// Top cards
router.get("/stats",adminAuthMiddleware, getCouponStats);

// Coupon table
// Supports:
// ?page=1
// ?limit=10
// ?search=WELCOME
// ?status=active
router.get("/", adminAuthMiddleware, getAdminCoupons);

module.exports = router;
