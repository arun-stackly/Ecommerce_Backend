


// ==========================================
// ROUTES
// ==========================================

const express = require("express");

const router = express.Router();

const {
  getHomePage,getProductsByBrand
} = require(
  "../controllers/fashionHomepageController"
);


// FASHION LANDING PAGE
router.get(
  "/:categoryId",
  getHomePage
);


module.exports = router;