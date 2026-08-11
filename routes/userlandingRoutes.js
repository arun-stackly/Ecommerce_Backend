const express = require("express");
const router = express.Router();
const userController = require("../controllers/userlandingController");

router.get("/recently-added", userController.getRecentlyAddedProducts);

router.get("/fashion-home", userController.getFashionHomePage);

router.get(
  "/featured-deals",
  userController.getFeaturedDeals
);

router.get(
  "/product-images",
  userController.getProductImageGallery
);

module.exports = router;