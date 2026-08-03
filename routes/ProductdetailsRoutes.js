const express = require("express");
const router = express.Router();

const {
  getProductById,
  getSimilarProducts,
  getProductStock,
  searchProducts,
  checkDelivery,
} = require("../controllers/ProductDetails");

router.get("/search", searchProducts);

router.get("/check", checkDelivery);

router.get("/:id", getProductById);

router.get("/:id/similar", getSimilarProducts);

router.get("/:id/stock", getProductStock);

module.exports = router;