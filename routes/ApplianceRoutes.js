const express = require("express");

const router = express.Router();

const {
  getBannersBySubcategory,
  getTopRatedProducts,
  getTopBrandsByCategory,
} = require(
  "../controllers/ApplianceController"
);

/* =====================================================
   ROUTES
===================================================== */

// ✅ GET BANNERS BY SUBSUBCATEGORY
router.get(
  "/banners/:subcategoryId",
  getBannersBySubcategory
);

// ✅ GET TOP RATED PRODUCTS
router.get(
  "/top-rated/:subcategoryId",
  getTopRatedProducts
);

// ✅ GET TOP BRANDS BY CATEGORY
router.get(
  "/top-brands/:categoryId",
  getTopBrandsByCategory
);

module.exports = router;