const express = require("express");

const router = express.Router();

const {
  getBannersBySubcategory,
  getBannersByCategory,
  getBannersBySubSubCategory,
  getTopRatedProductsByCategory,
  getTopRatedProductsBySubSubCategory,
  getTopRatedProductsBySubcategory,
  getTopBrandsByCategory,
} = require(
  "../controllers/ElectronicsController"
);

/* =====================================================
   ROUTES
===================================================== */
// Banners by Category
router.get(
  "/category/:categoryId/banners",
  getBannersByCategory
);

// Banners by Subcategory
router.get(
  "/subcategory/:subcategoryId/banners",
  getBannersBySubcategory
);

// Banners by SubSubCategory
router.get(
  "/subsubcategory/:subSubCategoryId/banners",
  getBannersBySubSubCategory
);
// ✅ GET TOP RATED PRODUCTS
// Top Rated Products by Category
router.get(
  "/category/:categoryId/top-rated",
  getTopRatedProductsByCategory
);

// Top Rated Products by Subcategory
router.get(
  "/subcategory/:subcategoryId/top-rated",
  getTopRatedProductsBySubcategory
);

// Top Rated Products by SubSubCategory
router.get(
  "/subsubcategory/:subSubCategoryId/top-rated",
  getTopRatedProductsBySubSubCategory
);

// ✅ GET TOP BRANDS BY CATEGORY
router.get(
  "/top-brands/:categoryId",
  getTopBrandsByCategory
);

module.exports = router;