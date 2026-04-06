const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");

/* ================= GET CART ================= */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id });
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
  try {
    const { sellerId, sellerName, productId, name, price, quantity } = req.body;

    if (!sellerId || !productId || !price || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const qty = Number(quantity);
    const productPrice = Number(price);

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        sellerGroups: [],
      });
    }

    let sellerGroup = cart.sellerGroups.find(
      (s) => s.sellerId.toString() === sellerId.toString()
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
      (i) => i.productId.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += qty;
      existingItem.totalPrice = existingItem.quantity * productPrice;
    } else {
      sellerGroup.items.push({
        productId,
        name,
        price: productPrice,
        quantity: qty,
        totalPrice: productPrice * qty,
      });
    }

    calculateCartTotals(cart);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= REMOVE ITEM ================= */
exports.removeCartItem = async (req, res) => {
  try {
    const { productId, sellerId } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.sellerGroups = cart.sellerGroups
      .map((seller) => {
        if (seller.sellerId.toString() === sellerId.toString()) {
          seller.items = seller.items.filter(
            (item) => item.productId.toString() !== productId.toString()
          );
        }
        return seller;
      })
      .filter((seller) => seller.items.length > 0);

    calculateCartTotals(cart);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= APPLY COUPON ================= */
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= REMOVE COUPON ================= */
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.coupon = undefined;

    calculateCartTotals(cart);
    await cart.save();

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
  try {
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
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};