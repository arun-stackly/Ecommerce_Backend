const express = require("express");

const router = express.Router();

const {
  getProductById,
  getProductReviews,
  getSimilarProducts,
} = require(
  "../controllers/ApplianceProductdetailsController"
);

// ✅ GET PRODUCT BY SellerInventoryId
router.get(
  "/:SellerInventoryId",
  getProductById
);

// ✅ GET PRODUCT REVIEWS
router.get(
  "/:SellerInventoryId/reviews",
  getProductReviews
);

// ✅ GET SIMILAR PRODUCTS
router.get(
  "/similar/:SellerInventoryId",
  getSimilarProducts
);

module.exports = router;