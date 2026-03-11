const express = require("express");
const router = express.Router();

const fashionController = require("../controllers/fashionHomepageController");

// Homepage APIs
router.get("/products/latest", fashionController.getLatestProducts);
router.get("/products/brand/:brandName", fashionController.getBrandProducts);
router.get("/banners", fashionController.getBanners);
router.get("/promotions", fashionController.getPromotions);
router.get("/brands/top", fashionController.getTopBrands);
router.get("/deals", fashionController.getDeals);

module.exports = router;