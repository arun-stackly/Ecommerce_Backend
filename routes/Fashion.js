const express = require("express");
const router = express.Router();

const FashionController = require("../controllers/Fashion");

// =======================================
// 1. Get All Products
// GET /api/products
// =======================================
router.get("/products", FashionController.getProducts);


// =======================================
// 2. Get Products By Product Type
// GET /api/category/:producttypeId/products
// =======================================
router.get(
  "/category/:categoryId/products",
  FashionController.getCategoryProducts
);

// =======================================
// 3. Filter Products
// GET /api/category/:producttypeId/filter
// =======================================
router.get(
  "/category/:producttypeId/filter",
  FashionController.getFilteredProducts
);


// =======================================
// 4. Upcoming Deals
// GET /api/category/:producttypeId/deals/upcoming
// =======================================
router.get(
  "/category/:producttypeId/deals/upcoming",
  FashionController.getUpcomingDeals
);


// =======================================
// 5. Top Rated Products
// GET /api/category/:producttypeId/top-rated
// =======================================
router.get(
  "/category/:producttypeId/top-rated",
  FashionController.getTopRatedProducts
);


// =======================================
// 6. Get Brands
// GET /api/category/:producttypeId/brands
// =======================================
router.get(
  "/category/:producttypeId/brands",
  FashionController.getCategoryBrands
);


module.exports = router;