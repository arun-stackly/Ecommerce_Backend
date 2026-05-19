const express =
  require("express");

const router =
  express.Router();

const {
  getMonthlyBanner,
  getTopDeal,
  getBestBrands,
  getBrandProducts,
} = require(
  "../controllers/Electronics_bestseller_mobileController"
);

// Banner
router.get(
  "/banner",
  getMonthlyBanner
);

// Top Deal
router.get(
  "/topdeal",
  getTopDeal
);

// Best Brands
router.get(
  "/bestbrands",
  getBestBrands
);

// Dynamic Brand Products
router.get(
  "/brand/:brandName",
  getBrandProducts
);

module.exports = router;