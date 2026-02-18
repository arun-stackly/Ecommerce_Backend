const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");

/* ================= GET CART ================= */
exports.getCart = async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    cart = await Cart.create({ userId: req.user._id });
  }

  res.json(cart);
};

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
  const { sellerId, sellerName, productId, name, price, quantity } = req.body;

  let cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    cart = await Cart.create({ userId: req.user._id });
  }

  let sellerGroup = cart.sellerGroups.find(
    (s) => s.sellerId.toString() === sellerId,
  );

  if (!sellerGroup) {
    sellerGroup = {
      sellerId,
      sellerName,
      items: [],
      sellerTotal: 0,
    };
    cart.sellerGroups.push(sellerGroup);
  }

  const existingItem = sellerGroup.items.find(
    (i) => i.productId.toString() === productId,
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.totalPrice = existingItem.quantity * price;
  } else {
    sellerGroup.items.push({
      productId,
      name,
      price,
      quantity,
      totalPrice: price * quantity,
    });
  }

  calculateCartTotals(cart);

  await cart.save();
  res.json(cart);
};

/* ================= REMOVE ITEM ================= */
exports.removeCartItem = async (req, res) => {
  const { productId, sellerId } = req.body;

  const cart = await Cart.findOne({ userId: req.user._id });

  cart.sellerGroups = cart.sellerGroups.map((seller) => {
    if (seller.sellerId.toString() === sellerId) {
      seller.items = seller.items.filter(
        (item) => item.productId.toString() !== productId,
      );
    }
    return seller;
  });

  calculateCartTotals(cart);

  await cart.save();
  res.json(cart);
};

/* ================= APPLY COUPON ================= */
exports.applyCoupon = async (req, res) => {
  const { couponCode } = req.body;

  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) return res.status(404).json({ message: "Cart not found" });

  // Example coupon
  if (couponCode === "NEWUSER100") {
    cart.coupon = {
      couponCode,
      couponType: "FLAT",
      couponDiscount: 100,
      applied: true,
    };
  } else {
    return res.status(400).json({ message: "Invalid coupon" });
  }

  calculateCartTotals(cart);

  await cart.save();
  res.json(cart);
};

/* ================= REMOVE COUPON ================= */
exports.removeCoupon = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });

  cart.coupon = undefined;

  calculateCartTotals(cart);

  await cart.save();
  res.json(cart);
};

/* ================= PRICE CALCULATION ================= */
function calculateCartTotals(cart) {
  let totalPrice = 0;

  cart.sellerGroups.forEach((seller) => {
    let sellerTotal = 0;

    seller.items.forEach((item) => {
      sellerTotal += item.totalPrice;
    });

    seller.sellerTotal = sellerTotal;
    totalPrice += sellerTotal;
  });

  cart.priceDetails.price = totalPrice;
  cart.priceDetails.couponDiscount = cart.coupon?.couponDiscount || 0;

  cart.priceDetails.totalAmount =
    cart.priceDetails.price -
    cart.priceDetails.discount -
    cart.priceDetails.couponDiscount +
    cart.priceDetails.platformFee;
}
/* ================= SET DELIVERY ADDRESS ================= */
exports.setDeliveryAddress = async (req, res) => {
  const { addressId } = req.body;

  const cart = await Cart.findOne({ userId: req.user._id });
  if (!cart) {
    return res.status(404).json({ message: "Cart not found" });
  }

  const address = await Address.findById(addressId);
  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  cart.deliveryTo = {
    city: address.city,
    pincode: address.pincode,
    district: address.district,
    state: address.state,
    country: address.country,
  };

  await cart.save();

  res.json({
    message: "Delivery address set",
    deliveryTo: cart.deliveryTo,
  });
};
