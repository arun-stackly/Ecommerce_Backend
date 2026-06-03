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
/* =========================================
   TOP SALE
========================================= */
 
router.get("/:categoryId/top-sale", homeController.getTopSaleOfMonth);
 
/* =========================================
   PRICE LOW TO HIGH
========================================= */
 
router.get("/:categoryId/price-low-high", homeController.getPriceLowToHigh);
 
/* =========================================
   PRICE HIGH TO LOW
========================================= */
 
router.get("/:categoryId/price-high-low", homeController.getPriceHighToLow);
 

module.exports = router;