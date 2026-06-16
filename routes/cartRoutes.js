const express = require("express");
const router = express.Router();

const { protectUser } = require("../middleware/userAuthMiddleware");

const {
  getCart,
  addToCart,
  removeCartItem,
  addCoupon,
  applyCoupon,
  removeCoupon,
  getAvailableCoupons,
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
router.post("/add-coupon", addCoupon);
router.post("/apply-coupon", applyCoupon);
router.delete("/remove-coupon", removeCoupon);
router.get("/coupons", getAvailableCoupons);
router.put("/set-delivery-address", setDeliveryAddress);
router.get("/similar/:sellerInventoryId", getRelatedProducts)
router.delete("/clear-cart", clearCart);
module.exports = router;
