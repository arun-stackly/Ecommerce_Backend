const express =
  require("express");

const router =
  express.Router();

const {

  // Monthly Banner
  getMonthlyBanner,

  // Top Deal
  getTopDeal,

  // Best Seller Brands
  getBestSellerBrands,

  // Top Rated Products
  getTopRatedProducts,


} = require(
  "../controllers/Electronics_bestseller_mobileController"
);

/* =========================================================
   1. MONTHLY BANNER
   GET /api/bestseller/mobile/banner
========================================================= */

router.get(
  "/banner",
  getMonthlyBanner
);

/* =========================================================
   2. TOP DEAL OF THE DAY
   GET /api/bestseller/mobile/topdeal
========================================================= */

router.get(
  "/topdeal",
  getTopDeal
);

/* =========================================================
   3. BEST SELLER BRANDS
   GET /api/bestseller/mobile/bestbrands
========================================================= */

router.get(
  "/bestbrands",
  getBestSellerBrands
);


/* =========================================================
   4. TOP RATED PRODUCTS OF BRAND
   GET /api/bestseller/mobile/toprated/:brandName
========================================================= */

router.get(
  "/toprated/:brandName",
  getTopRatedProducts
);


module.exports =
  router;