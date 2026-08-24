const express = require("express");

const router = express.Router();

const {
  getAdStats,
  getAdminAds,
  getAdminAdById,
  approveAd,
  rejectAd,
} = require("../controllers/adminAdController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

/* ==========================================
   ADMIN ADVERTISEMENT MANAGEMENT
========================================== */

// Dashboard cards
router.get(
  "/stats",adminAuthMiddleware,
  getAdStats
);

// List / search / filter
router.get(
  "/",adminAuthMiddleware,
  getAdminAds
);

// Single advertisement
router.get(
  "/:id",adminAuthMiddleware,
  getAdminAdById
);

// Approve
router.patch(
  "/:id/approve",adminAuthMiddleware,
  approveAd
);

// Reject
router.patch(
  "/:id/reject",adminAuthMiddleware,
  rejectAd
);


module.exports = router;
