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
  deleteCoupon,
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


// User
router.post("/apply-coupon", protectUser, applyCoupon);
router.delete("/remove-coupon", protectUser, removeCoupon);
router.get("/coupons", protectUser, getAvailableCoupons);

router.put("/set-delivery-address",protectUser, setDeliveryAddress);
router.get("/similar/:sellerInventoryId",protectUser, getRelatedProducts)
router.delete("/clear-cart",protectUser, clearCart);
module.exports = router;
