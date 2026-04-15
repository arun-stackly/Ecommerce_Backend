const express = require("express");
const router = express.Router();

const {
  getSimilarProducts,
  getProductReviews,
  searchProducts,
  getAllDeals,
  getProductById,
  addReview,
  getProductStock
} = require("../controllers/FashionProductDetails");

const { protectUser } = require("../middleware/userAuthMiddleware"); // for review

// 🔹 Product APIs
router.get("/search", searchProducts);
router.get("/deals", getAllDeals);

router.get("/:id", getProductById);
router.get("/:id/similar", getSimilarProducts);
router.get("/:id/reviews", getProductReviews);
router.get("/:id/stock", getProductStock);

// 🔹 Protected
router.post("/:id/review", protectUser, addReview);

module.exports = router;