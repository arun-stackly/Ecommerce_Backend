const express = require("express");
const router = express.Router();

const { protectUser } = require("../middleware/userAuthMiddleware");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const {
  getCart,
  addToCart,
  removeCartItem,
  addCoupon,
  applyCoupon,
  removeCoupon,
  getAvailableCoupons,
  updateCoupon,
  setDeliveryAddress,
  updateCartQuantity,
  getRelatedProducts,
  clearCart,
} = require("../controllers/cartController");

router.use(protectUser);

router.get("/", getCart);
router.post("/add", addToCart);
router.put(
  "/update-quantity",
 protectUser,
  updateCartQuantity
);
router.delete("/remove", removeCartItem);
// Admin only route (you can add auth middleware later)
router.post("/add-coupon", adminAuthMiddleware,addCoupon);
router.post("/apply-coupon",adminAuthMiddleware, applyCoupon);
router.delete("/remove-coupon",adminAuthMiddleware, removeCoupon);
router.get("/coupons",adminAuthMiddleware, getAvailableCoupons);
router.patch("/:id",adminAuthMiddleware, updateCoupon);

router.put("/set-delivery-address", setDeliveryAddress);
router.get("/similar/:sellerInventoryId", getRelatedProducts)
router.delete("/clear-cart", clearCart);
module.exports = router;
