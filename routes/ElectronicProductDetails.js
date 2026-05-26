// routes/productDetails.routes.js

const express = require("express");

const router = express.Router();

const ProductDetailsController =
  require("../controllers/productDetails.controller");

// PRODUCT DETAILS
router.get(
  "/products/:id",
  ProductDetailsController.getProductDetails
);

// PRODUCT STOCK
router.get(
  "/products/:id/stock",
  ProductDetailsController.getProductStock
);

// SIMILAR PRODUCTS
router.get(
  "/products/:id/similar",
  ProductDetailsController.getSimilarProducts
);

// SEARCH PRODUCTS
router.get(
  "/products/search",
  ProductDetailsController.searchProducts
);

// DEALS
router.get(
  "/deals",
  ProductDetailsController.getAllDeals
);

// REVIEWS
router.get(
  "/products/:id/reviews",
  ProductDetailsController.getProductReviews
);

// ADD REVIEW
router.post(
  "/products/:id/reviews",
  ProductDetailsController.addReview
);

// RECENTLY VIEWED
router.get(
  "/products/recently-viewed",
  ProductDetailsController.getRecentlyViewed
);

// ACCESSORIES
router.get(
  "/products/:id/accessories",
  ProductDetailsController.getAccessoriesProducts
);

// BEST SELLERS
router.get(
  "/categories/:categoryId/best-sellers",
  ProductDetailsController.getBestSellers
);

// RECOMMENDED PRODUCTS
router.get(
  "/products/:id/recommended",
  ProductDetailsController.getRecommendedProducts
);

module.exports = router;