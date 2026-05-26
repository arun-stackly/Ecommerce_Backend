const express =
  require("express");

const router =
  express.Router();

const {
  getMonthlyBanner,
  getTopDeal,
  getBestSellerBrands,
  getBrandProducts,
} = require(
  "../controllers/Electronics_bestseller_mobileController"
);

// =======================================================
// MONTHLY BANNER
// =======================================================

router.get(
  "/banner",
  getMonthlyBanner
);

// =======================================================
// TOP DEAL
// =======================================================

router.get(
  "/topdeal",
  getTopDeal
);

// =======================================================
// BEST SELLER BRANDS
// =======================================================

router.get(
  "/bestbrands",
  getBestSellerBrands
);

// =======================================================
// BRAND PRODUCTS
// =======================================================

router.get(
  "/brand/:brandName",
  getBrandProducts
);

module.exports =
  router;