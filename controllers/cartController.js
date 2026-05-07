const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const Product = require("../models/Product")
 
exports.getCart = async (req, res) => {
  try {

    let cart = await Cart.findOne({
      userId: req.user._id,
    }).populate({
      path: "sellerGroups.items.productId",
      select: "name price discountPrice images",
    });

    /* ===== CREATE EMPTY CART ===== */

    if (!cart) {

      cart = await Cart.create({
        userId: req.user._id,
        sellerGroups: [],
      });

      return res.status(200).json({
        success: true,
        cart: {
          sellerGroups: [],
          priceDetails: cart.priceDetails,
        },
      });
    }

    /* ===== FORMAT RESPONSE ===== */

    const formattedCart = {
      _id: cart._id,

      userId: cart.userId,

      sellerGroups: cart.sellerGroups.map(
        (seller) => ({

          sellerId: seller.sellerId,

          sellerName: seller.sellerName,

          sellerTotal: seller.sellerTotal,

          items: seller.items

            .filter((item) => item.productId)

            .map((item) => {

              const product = item.productId;

              const productPrice =
                product.discountPrice ||
                product.price;

              return {

                productId: product._id,

                name: product.name,

                image:
                  product.images?.[0] || "",

                price: productPrice,

                quantity: item.quantity,

                totalPrice:
                  productPrice * item.quantity,
              };
            }),
        })
      ),

      priceDetails: cart.priceDetails,
    };

    res.status(200).json({
      success: true,
      cart: formattedCart,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

 
/* ================= ADD TO CART ================= */

exports.addToCart = async (req, res) => {

  try {

    const {

      sellerId,

      sellerName,

      productId,

      quantity,

    } = req.body;
 
    /* ===== VALIDATION ===== */

    if (

      !sellerId ||

      !sellerName ||

      !productId ||

      !quantity

    ) {

      return res.status(400).json({

        success: false,

        message: "Missing required fields",

      });

    }
 
    const qty = Number(quantity);
 
    /* ===== FIND PRODUCT ===== */

    const product = await Product.findById(productId);
 
    if (!product) {

      return res.status(404).json({

        success: false,

        message: "Product not found",

      });

    }
 
    /* ===== GET PRODUCT PRICE ===== */

    const finalPrice =

      product.discountPrice || product.price;
 
    /* ===== FIND USER CART ===== */

    let cart = await Cart.findOne({

      userId: req.user._id,

    });
 
    /* ===== CREATE CART ===== */

    if (!cart) {

      cart = await Cart.create({

        userId: req.user._id,

        sellerGroups: [],

      });

    }
 
    /* ===== FIND SELLER GROUP ===== */

    let sellerGroup = cart.sellerGroups.find(

      (s) => s.sellerId.toString() === sellerId.toString()

    );
 
    /* ===== CREATE SELLER GROUP ===== */

    if (!sellerGroup) {

      cart.sellerGroups.push({

        sellerId,

        sellerName,

        items: [],

        sellerTotal: 0,

      });
 
      sellerGroup =

        cart.sellerGroups[

          cart.sellerGroups.length - 1

        ];

    }
 
    /* ===== CHECK EXISTING ITEM ===== */

    const existingItem = sellerGroup.items.find(

      (item) =>

        item.productId.toString() ===

        productId.toString()

    );
 
    /* ===== UPDATE ITEM ===== */

    if (existingItem) {
 
      existingItem.quantity += qty;
 
      existingItem.totalPrice =

        existingItem.quantity * finalPrice;
 
    } else {
 
      /* ===== ADD NEW ITEM ===== */

      sellerGroup.items.push({

        productId: product._id,
 
        quantity: qty,
 
        totalPrice: finalPrice * qty,

      });

    }
 
    /* ===== CALCULATE TOTALS ===== */

    calculateCartTotals(cart);
 
    await cart.save();
 
    /* ===== POPULATE PRODUCT ===== */

    const updatedCart = await Cart.findById(cart._id)

      .populate({

        path: "sellerGroups.items.productId",

        select:

          "name price discountPrice images",

      });
 
    /* ===== FORMAT RESPONSE ===== */

    const formattedCart = {

      _id: updatedCart._id,
 
      userId: updatedCart.userId,
 
      sellerGroups:

        updatedCart.sellerGroups.map((seller) => ({

          sellerId: seller.sellerId,
 
          sellerName: seller.sellerName,
 
          sellerTotal: seller.sellerTotal,
 items: seller.items
  .filter((item) => item.productId)
  .map((item) => {

    const product = item.productId;

    const productPrice =
      product.discountPrice || product.price;

    return {
      productId: product._id,

      name: product.name,

      image:
        product.images?.[0] || "",

      price: productPrice,

      quantity: item.quantity,

      totalPrice:
        productPrice * item.quantity,
    
            };

          }),

        })),
 
      priceDetails: updatedCart.priceDetails,

    };
 
    res.status(200).json({

      success: true,

      message: "Product added to cart",

      cart: formattedCart,

    });
    console.log(req.body);
 
  } catch (error) {
 
    res.status(500).json({

      success: false,

      message: error.message,

    });
 
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
 
  cart.priceDetails.couponDiscount =

    cart.coupon?.couponDiscount || 0;
 
  cart.priceDetails.totalAmount =

    cart.priceDetails.price -

    cart.priceDetails.discount -

    cart.priceDetails.couponDiscount +

    cart.priceDetails.platformFee;

} 
 
 
/* ================= REMOVE ITEM ================= */
exports.removeCartItem = async (req, res) => {
  try {
    const { productId, sellerId } = req.body;
 
    const cart = await Cart.findOne({
      userId: req.user._id,
    });
 
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
 
    cart.sellerGroups = cart.sellerGroups
      .map((seller) => {
        if (seller.sellerId.toString() === sellerId.toString()) {
          seller.items = seller.items.filter(
            (item) => item.productId.toString() !== productId.toString(),
          );
        }
 
        return seller;
      })
      .filter((seller) => seller.items.length > 0);
 
    calculateCartTotals(cart);
 
    await cart.save();
 
    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* ================= APPLY COUPON ================= */
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
 
    const cart = await Cart.findOne({
      userId: req.user._id,
    });
 
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
 
    if (couponCode === "NEWUSER100") {
      cart.coupon = {
        couponCode,
        couponType: "FLAT",
        couponDiscount: 100,
        applied: true,
      };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon",
      });
    }
 
    calculateCartTotals(cart);
 
    await cart.save();
 
    res.status(200).json({
      success: true,
      message: "Coupon applied",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* ================= REMOVE COUPON ================= */
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      userId: req.user._id,
    });
 
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
 
    cart.coupon = undefined;
 
    calculateCartTotals(cart);
 
    await cart.save();
 
    res.status(200).json({
      success: true,
      message: "Coupon removed",
      cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
 
    const cart = await Cart.findOne({
      userId: req.user._id,
    });
 
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
 
    const address = await Address.findById(addressId);
 
    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }
 
    cart.deliveryTo = {
      city: address.city,
      pincode: address.pincode,
      district: address.district,
      state: address.state,
      country: address.country,
    };
 
    await cart.save();
 
    res.status(200).json({
      success: true,
      message: "Delivery address set",
      deliveryTo: cart.deliveryTo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 