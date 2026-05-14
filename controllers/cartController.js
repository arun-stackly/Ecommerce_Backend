const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const SellerInventory = require("../models/SellerInventory");
 
/* ================= GET CART ================= */

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      userId: req.user._id,
    }).populate({
      path: "sellerGroups.items.sellerInventoryId",
      select: "name price media seller quantity isActive sizes",
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
          deliveryTo: null,
          priceDetails: cart.priceDetails,
        },
      });
    }

    /* ===== FORMAT RESPONSE ===== */

    const formattedCart = {
      _id: cart._id,

      userId: cart.userId,

      deliveryTo:
        cart.deliveryTo &&
        cart.deliveryTo.city &&
        cart.deliveryTo.pincode
          ? `Deliver in : ${cart.deliveryTo.city} - ${cart.deliveryTo.pincode}`
          : null,

      sellerGroups: cart.sellerGroups.map((seller) => ({
        sellerId: seller.sellerId,

        sellerName: seller.sellerName,

        sellerTotal: seller.sellerTotal,

        items: seller.items
          .filter((item) => item.sellerInventoryId)
          .map((item) => {
            const inventory = item.sellerInventoryId;

            return {
              sellerInventoryId: inventory._id,

              name: inventory.name,

              image:
                inventory.media?.find((m) => m.type === "image")?.url || "",

              price: inventory.price,

              quantity: item.quantity,

              size: item.size,

              availableSizes: inventory.sizes || [],
              
               deliveryIn: "5-7 Days",

              totalPrice: inventory.price * item.quantity,
            };
          }),
      })),

      priceDetails: cart.priceDetails,
    };

    res.status(200).json({
      success: true,
      cart: formattedCart,
    });
  } catch (error) {
    console.log("GET CART ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= ADD TO CART ================= */

exports.addToCart = async (req, res) => {
  try {
    const { sellerInventoryId, quantity, size } = req.body;

    /* ===== VALIDATION ===== */

    if (!sellerInventoryId || !quantity || !size) {
      return res.status(400).json({
        success: false,
        message: "sellerInventoryId, quantity and size are required",
      });
    }

    const qty = Number(quantity);

    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    /* ===== FIND INVENTORY ===== */

    const inventory = await SellerInventory.findById(
      sellerInventoryId
    ).populate("seller", "firstName lastName username");

    if (!inventory || !inventory.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    /* ===== SIZE VALIDATION ===== */

    if (!inventory.sizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: "Invalid size selected",
      });
    }

    /* ===== STOCK CHECK ===== */

    if (qty > inventory.quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const finalPrice = inventory.price;

    /* ===== FIND USER CART ===== */

    let cart = await Cart.findOne({
      userId: req.user._id,
    });

    /* ===== CREATE EMPTY CART ===== */

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        sellerGroups: [],
      });
    }

    /* ===== FIND SELLER GROUP ===== */

    let sellerGroup = cart.sellerGroups.find(
      (s) => s.sellerId.toString() === inventory.seller._id.toString()
    );

    /* ===== CREATE SELLER GROUP ===== */

    if (!sellerGroup) {
      cart.sellerGroups.push({
        sellerId: inventory.seller._id,

        sellerName: `${inventory.seller.firstName} ${inventory.seller.lastName}`,

        items: [],

        sellerTotal: 0,
      });

      sellerGroup = cart.sellerGroups[cart.sellerGroups.length - 1];
    }

    /* ===== CHECK EXISTING ITEM ===== */

    const existingItem = sellerGroup.items.find(
      (item) =>
        item.sellerInventoryId.toString() ===
          sellerInventoryId.toString() &&
        item.size === size
    );

    /* ===== UPDATE EXISTING ITEM ===== */

    if (existingItem) {
      const updatedQty = existingItem.quantity + qty;

      if (updatedQty > inventory.quantity) {
        return res.status(400).json({
          success: false,
          message: "Quantity exceeds stock limit",
        });
      }

      existingItem.quantity = updatedQty;

      existingItem.totalPrice = updatedQty * finalPrice;
    } else {
      /* ===== ADD NEW ITEM ===== */

      sellerGroup.items.push({
        sellerInventoryId: inventory._id,

        quantity: qty,

        size,

        totalPrice: finalPrice * qty,
      });
    }

    /* ===== CALCULATE TOTALS ===== */

    calculateCartTotals(cart);

    await cart.save();

    /* ===== GET UPDATED CART ===== */

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "sellerGroups.items.sellerInventoryId",

      select: "name price media seller quantity isActive sizes",
    });

    /* ===== FORMAT RESPONSE ===== */

    const formattedCart = {
      _id: updatedCart._id,

      userId: updatedCart.userId,

      deliveryTo:
        updatedCart.deliveryTo &&
        updatedCart.deliveryTo.city &&
        updatedCart.deliveryTo.pincode
          ? `Deliver in : ${updatedCart.deliveryTo.city} - ${updatedCart.deliveryTo.pincode}`
          : null,

      sellerGroups: updatedCart.sellerGroups.map((seller) => ({
        sellerId: seller.sellerId,

        sellerName: seller.sellerName,

        sellerTotal: seller.sellerTotal,

        items: seller.items
          .filter((item) => item.sellerInventoryId)
          .map((item) => {
            const inventory = item.sellerInventoryId;

            return {
              sellerInventoryId: inventory._id,

              name: inventory.name,

              image:
                inventory.media?.find((m) => m.type === "image")?.url || "",

              price: inventory.price,

              quantity: item.quantity,

              size: item.size,

              availableSizes: inventory.sizes || [],

               deliveryIn: "5-7 Days",

              totalPrice: inventory.price * item.quantity,
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
  } catch (error) {
    console.error("Add To Cart Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= REMOVE ITEM ================= */
exports.removeCartItem = async (req, res) => {
  try {

    const { cartItemId } = req.body;

    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    let itemFound = false;

    cart.sellerGroups = cart.sellerGroups
      .map((sellerGroup) => {

        sellerGroup.items =
          sellerGroup.items.filter((item) => {

            if (
              item._id.toString() ===
              cartItemId
            ) {
              itemFound = true;
              return false;
            }

            return true;
          });

        return sellerGroup;
      })

      .filter(
        (sellerGroup) =>
          sellerGroup.items.length > 0
      );

    if (!itemFound) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    calculateCartTotals(cart);

    await cart.save();

    return res.status(200).json({
      success: true,
      message:
        "Item removed from cart",
      cart,
    });

  } catch (error) {

    return res.status(500).json({
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
 
 /* ================= UPDATE CART QUANTITY ================= */

exports.updateCartQuantity = async (req, res) => {
  try {
    const {
      sellerInventoryId,
      quantity,
    } = req.body;

    if (
      !sellerInventoryId ||
      !quantity
    ) {
      return res.status(400).json({
        success: false,
        message:
          "sellerInventoryId and quantity are required",
      });
    }

    const qty = Number(quantity);

    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be greater than 0",
      });
    }

    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const inventory =
      await SellerInventory.findById(
        sellerInventoryId
      );

    if (!inventory || !inventory.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    if (qty > inventory.quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const sellerGroup =
      cart.sellerGroups.find(
        (seller) =>
          seller.sellerId.toString() ===
          sellerId.toString()
      );

    if (!sellerGroup) {
      return res.status(404).json({
        success: false,
        message: "Seller group not found",
      });
    }

    const cartItem =
      sellerGroup.items.find(
        (item) =>
          item.sellerInventoryId.toString() ===
            sellerInventoryId.toString() &&
          item.size === size
      );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    cartItem.quantity = qty;

    cartItem.totalPrice =
      qty * inventory.price;

    calculateCartTotals(cart);

    await cart.save();

    res.status(200).json({
      success: true,
      message:
        "Cart quantity updated successfully",
      cart,
    });
  } catch (error) {
    console.log(
      "UPDATE CART QUANTITY ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};