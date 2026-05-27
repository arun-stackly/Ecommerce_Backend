// routes/productDetails.routes.js

const express = require("express");

const router = express.Router();

const ProductDetailsController =
  require("../controllers/Electronics_ProductDetails");

/* =========================================
   PRODUCT DETAILS
   GET /api/products/:id
========================================= */

router.get(
  "/:id",
  ProductDetailsController.getProductById
);

/* =========================================
   PRODUCT STOCK
   GET /api/products/:id/stock
========================================= */

router.get(
  "/:id/stock",
  ProductDetailsController.getProductStock
);

/* =========================================
   SIMILAR PRODUCTS
   GET /api/products/:id/similar
========================================= */

router.get(
  "/:id/similar",
  ProductDetailsController.getSimilarProducts
);

/* =========================================
   PRODUCT REVIEWS
   GET /api/products/:id/reviews
========================================= */

router.get(
  "/:id/reviews",
  ProductDetailsController.getProductReviews
);


/* =========================================
   RECENTLY VIEWED PRODUCTS
   GET /api/products/recently-viewed
========================================= */

router.get(
  "/recently-viewed",
  ProductDetailsController.getRecentlyViewed
);

/* =========================================
   ACCESSORIES PRODUCTS
   GET /api/products/:id/accessories
========================================= */

router.get(
  "/:id/accessories",
  ProductDetailsController.getAccessoriesProducts
);

/* =========================================
   BEST SELLERS
   GET /api/products/categories/:categoryId/best-sellers
========================================= */

router.get(
  "/categories/:categoryId/best-sellers",
  ProductDetailsController.getBestSellers
);

/* =========================================
   RECOMMENDED PRODUCTS
   GET /api/products/:id/recommended
========================================= */

router.get(
  "/:id/recommended",
  ProductDetailsController.getRecommendedProducts
);



module.exports = router;