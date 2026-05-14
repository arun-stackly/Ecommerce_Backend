const express = require("express");
const router = express.Router();

const {
  getSimilarProducts,
  searchProducts,
  getAllDeals,
  getProductById,
  getProductStock
} = require("../controllers/FashionProductDetails");

const { protectUser } = require("../middleware/userAuthMiddleware"); // for review

// 🔹 Product APIs
router.get("/search", searchProducts);
router.get("/deals", getAllDeals);

router.get("/:id", getProductById);
router.get("/:id/similar", getSimilarProducts);
router.get("/:id/stock", getProductStock);


module.exports = router;