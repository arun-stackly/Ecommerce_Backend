const express = require("express");

const {
  getProductSummary,
  getProductCategoryStats,
  getAdminProducts,
  getAdminProductById,
} = require("../controllers/adminProductController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const router = express.Router();

// Dashboard cards
router.get(
  "/summary", adminAuthMiddleware,
  getProductSummary
);

// Products by category
router.get(
  "/category-stats",adminAuthMiddleware,
  getProductCategoryStats
);

// Product table
router.get(
  "/",adminAuthMiddleware,
  getAdminProducts
);

// Single product
router.get(
  "/:id",adminAuthMiddleware,
  getAdminProductById
);

module.exports = router;
