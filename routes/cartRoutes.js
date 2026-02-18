const express = require("express");
const router = express.Router();

const { protectUser } = require("../middleware/userAuthMiddleware");

const {
  getCart,
  addToCart,
  removeCartItem,
  applyCoupon,
  removeCoupon,
  setDeliveryAddress,
} = require("../controllers/cartController");

router.use(protectUser);

router.get("/", getCart);
router.post("/add", addToCart);
router.delete("/remove", removeCartItem);

router.post("/apply-coupon", applyCoupon);
router.delete("/remove-coupon", removeCoupon);

router.put("/set-delivery-address", setDeliveryAddress);

module.exports = router;
