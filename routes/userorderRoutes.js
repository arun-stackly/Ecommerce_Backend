const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware"); // seller middleware
const { protectUser } = require("../middleware/userAuthMiddleware"); // customer middleware

const userOrderController = require("../controllers/userorderController");


// 🔥 STATIC ROUTES FIRST
router.post("/create-order", protectUser, userOrderController.createOrder);



// list routes
router.get("/", protectUser, userOrderController.getOrders);
router.patch("/:id/status", protect,  userOrderController.updateOrderStatus);

// 🔥 DYNAMIC ROUTES LAST
router.get("/:id", protectUser, userOrderController.getSingleOrder);
router.get(
  "/:orderId/items/:itemId",
  protectUser,
  userOrderController.getSingleOrderItem
);
router.post("/:id/review", protectUser, userOrderController.addReview);
router.get("/:id/reviews", userOrderController.getProductReviews);
/* =========================
   NEW ROUTES
========================= */
 
// Cancel Order
router.put("/cancel/:id", protectUser, userOrderController.cancelOrder);
 
// COD Cancelled Order Details
router.get(
  "/cancelled/cod/:id",
  protectUser,
  userOrderController.getCancelledCODOrder,
);
 
router.get(
  "/cancelled/prepaid/:id",
  protectUser,
  userOrderController.getCancelledPrepaidOrder,
);
 
// Get invoice by order id
router.get("/invoice/:id", userOrderController.getOrderInvoice);
router.get("/status-items/:status",protectUser, userOrderController.getOrdersByStatusWithItems);
module.exports = router;