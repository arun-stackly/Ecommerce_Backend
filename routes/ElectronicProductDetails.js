const express = require("express");

const router = express.Router();

const ProductDetailsController =
  require("../controllers/Electronics_ProductDetails");

// PRODUCT DETAILS
router.get(
  "/:id",
  ProductDetailsController.getProductDetails
);

// PRODUCT STOCK
router.get(
  "/:id/stock",
  ProductDetailsController.getProductStock
);

// SIMILAR PRODUCTS
router.get(
  "/:id/similar",
  ProductDetailsController.getSimilarProducts
);

// SEARCH PRODUCTS
router.get(
  "/search",
  ProductDetailsController.searchProducts
);

// DEALS
router.get(
  "/deals",
  ProductDetailsController.getAllDeals
);

// REVIEWS
router.get(
  "/:id/reviews",
  ProductDetailsController.getProductReviews
);

// ADD REVIEW
router.post(
  "/:id/reviews",
  ProductDetailsController.addReview
);

// RECENTLY VIEWED
router.get(
  "/recently-viewed",
  ProductDetailsController.getRecentlyViewed
);

// ACCESSORIES
router.get(
  "/:id/accessories",
  ProductDetailsController.getAccessoriesProducts
);

// BEST SELLERS
router.get(
  "/categories/:categoryId/best-sellers",
  ProductDetailsController.getBestSellers
);

// RECOMMENDED PRODUCTS
router.get(
  "/:id/recommended",
  ProductDetailsController.getRecommendedProducts
);

module.exports = router;