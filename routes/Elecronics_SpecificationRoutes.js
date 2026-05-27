// routes/productDetails.routes.js

const express = require("express");

const router = express.Router();

const ProductDetailsController =
  require("../controllers/Electronics_SpecificationController");

/* =========================================
   GET PRODUCT SPECIFICATIONS
========================================= */

router.get(
  "/specs/:sellerInventoryId",
  ProductDetailsController.getProductSpecifications
);

/* =========================================
   GET PRODUCT BY ID
========================================= */

router.get(
  "/:id",
  ProductDetailsController.getProductById
);

module.exports = router;