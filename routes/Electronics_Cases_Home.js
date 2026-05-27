// routes/homeRoutes.js

const express =
  require("express");

const router =
  express.Router();

const homeController =
  require("../controllers/Electronics_Cases_Homepage");

/* =========================================
   BANNERS
========================================= */

router.get(
  "/banners",
  homeController.getBanners
);

/* =========================================
   BEST SELLERS
========================================= */

router.get(
  "/:categoryId/best-sellers",
  homeController.getBestSellers
);

/* =========================================
   TOP RATED
========================================= */

router.get(
  "/:categoryId/top-rated",
  homeController.getTopRatedProducts
);

/* =========================================
   RECOMMENDED
========================================= */

router.get(
  "/:categoryId/recommended",
  homeController.getRecommendedProducts
);

/* =========================================
   SEARCH
========================================= */

router.get(
  "/:categoryId/search",
  homeController.searchProducts
);

module.exports = router;