const express = require("express");
const router = express.Router();

const { protectUser }  = require("../middleware/userAuthMiddleware");
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

// router.use(c);

router.get("/",protectUser, getCart);
router.post("/add",protectUser, addToCart);
router.put(
  "/update-quantity",
 protectUser,
  updateCartQuantity
);
router.delete("/remove",protectUser, removeCartItem);
// Admin only route (you can add auth middleware later)
router.post("/add-coupon", adminAuthMiddleware,addCoupon);
router.post("/apply-coupon",adminAuthMiddleware, applyCoupon);
router.delete("/remove-coupon",adminAuthMiddleware, removeCoupon);
router.get("/coupons",adminAuthMiddleware, getAvailableCoupons);
router.patch("/:id",adminAuthMiddleware, updateCoupon);

router.put("/set-delivery-address",protectUser, setDeliveryAddress);
router.get("/similar/:sellerInventoryId",protectUser, getRelatedProducts)
router.delete("/clear-cart",protectUser, clearCart);
module.exports = router;
