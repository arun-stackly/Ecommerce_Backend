const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // seller middleware
const { protectUser } = require("../middleware/userAuthMiddleware"); // customer middleware

const userOrderController = require("../controllers/userorderController");


// 🔥 STATIC ROUTES FIRST
router.post("/create-order", protectUser, userOrderController.createOrder);
router.post("/verifystatus", userOrderController.verifyPayment);


// list routes
router.get("/", protectUser, userOrderController.getOrders);
router.patch("/:id/status", protect,  userOrderController.updateOrderStatus);

// 🔥 DYNAMIC ROUTES LAST
router.get("/:id", protectUser, userOrderController.getSingleOrder);
router.post("/:id/review", protectUser, userOrderController.addReview);
router.get("/:id/reviews", userOrderController.getProductReviews);
module.exports = router;