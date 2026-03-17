const express = require("express");
const router = express.Router();

const menController = require("../controllers/FashionMenController");

// ==============================
// ✅ PRODUCTS
// ==============================

// Get all products
router.get("/products", menController.getProducts);

// Get products by type & subSubcategory
// Example: /products/filter?productType=shirt&subSubcategoryId=123
router.get(
  "/filter",
  menController.getProductsByTypeAndSubSubCategory
);

// ==============================
// ✅ DEALS
// ==============================

// Get upcoming deals
router.get("/deals/upcoming", menController.getUpcomingDeals);

// ==============================
// ✅ MEN PAGE APIs
// ==============================

// Top rated men products
router.get(
  "/top-rated",
  menController.getTopRatedMenProducts
);

// Get men brands
router.get(
  "/brands/men",
  menController.getMenBrands
);

module.exports = router;