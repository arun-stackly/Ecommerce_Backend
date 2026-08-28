const express = require("express");

const router = express.Router();

const {
  getCouponStats,
  getAdminCoupons,
  addCoupon,
  updateCoupon,
  deleteCoupon,
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
/* ================= ADMIN COUPON ROUTES ================= */

router.post(
  "/",
  adminAuthMiddleware,
  addCoupon
);

router.patch(
  "/:id",
  adminAuthMiddleware,
  updateCoupon
);

router.delete(
  "/:id",
  adminAuthMiddleware,
  deleteCoupon
);
module.exports = router;
