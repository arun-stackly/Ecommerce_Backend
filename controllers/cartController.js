const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const SellerInventory = require("../models/SellerInventory");
const Coupon = require("../models/couponModel");


function getOfferDetails(inventory) {
  const price = Number(inventory.price || 0);

  const offerPrice =
    inventory.discountPrice > 0
      ? Number(inventory.discountPrice)
      : price;

  const offerPercentage =
    inventory.discountPrice > 0
      ? Math.round(
          ((price - inventory.discountPrice) / price) * 100
        )
      : 0;

  return {
    offerPrice,
    offerPercentage,
  };
}
/* ================= PRICE CALCULATION ================= */
function calculateCartTotals(cart) {
  let originalPrice = 0;
  let totalDiscount = 0;
  let sellingPrice = 0;

  cart.sellerGroups.forEach((seller) => {
    let sellerTotal = 0;

    seller.items.forEach((item) => {
      const inventory = item.sellerInventoryId;

      const mrp =
        Number(inventory.price || 0) *
        Number(item.quantity || 0);

      const offerPrice =
        inventory.discountPrice > 0
          ? inventory.discountPrice
          : inventory.price;

      const discountedTotal =
        offerPrice * item.quantity;

      originalPrice += mrp;

      sellingPrice += discountedTotal;

      totalDiscount += mrp - discountedTotal;

      sellerTotal += discountedTotal;
    });

    seller.sellerTotal = sellerTotal;
  });

  cart.priceDetails.price = originalPrice;

  cart.priceDetails.discount = totalDiscount;

  cart.priceDetails.platformFee =
    sellingPrice > 0 ? 40 : 0;

  cart.priceDetails.totalAmount =
    originalPrice -
    totalDiscount -
    (cart.priceDetails.couponDiscount || 0) +
    cart.priceDetails.platformFee;
}
/* ================= DELIVERY INFO ================= */

const getEstimatedDeliveryDate = () => {
  const date = new Date();

  // Delivery after 5 days
  date.setDate(date.getDate() + 5);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getDeliveryInfo = (cart) => {
  if (!cart?.deliveryTo?.city || !cart?.deliveryTo?.pincode) {
    return null;
  }

  return {
    deliverTo: `${cart.deliveryTo.city} - ${cart.deliveryTo.pincode}`,
    estimatedDelivery: getEstimatedDeliveryDate(),
    deliveryMessage:
      cart.priceDetails.totalAmount >= 500
        ? "Free Delivery"
        : "Delivery Charges Applicable",
  };
};
/* ================= GET CART ================= */
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate({
      path: "sellerGroups.items.sellerInventoryId",
      select:
        "name price discountPrice media seller quantity isActive sizes discountPercentage",
    });

    if (!cart) {
  return res.json({
    success: true,
    cart: {
      sellerGroups: [],
      itemsCount: 0,
      priceDetails: {
        price: 0,
        discount: 0,
        couponDiscount: 0,
        platformFee: 0,
        totalAmount: 0,
      },
    },
  });
}

cart.sellerGroups.forEach((seller) => {
  seller.items.forEach((item) => {
    const inventory = item.sellerInventoryId;

    const { offerPrice } = getOfferDetails(inventory);

    item.totalPrice =
      offerPrice * Number(item.quantity || 0);
  });
});

calculateCartTotals(cart);
await cart.save();

let itemsCount = 0;
const formatted = {
  _id: cart._id,
  userId: cart.userId,

  deliveryInfo: getDeliveryInfo(cart),

  sellerGroups: cart.sellerGroups.map((seller) => {
    return {
      sellerId: seller.sellerId,
      sellerName: seller.sellerName,
      sellerTotal: seller.sellerTotal,

      items: seller.items.map((item) => {
        const inventory = item.sellerInventoryId;

        const { offerPercentage, offerPrice } =
          getOfferDetails(inventory);

        itemsCount += item.quantity;

        return {
          cartItemId: item._id,
          sellerInventoryId: inventory._id,

          name: inventory.name,

          image:
            inventory.media?.find(
              (m) => m.type === "image"
            )?.url || "",

          price: inventory.price,

          discountPrice:
            inventory.discountPrice || inventory.price,

          offerPercentage: `${offerPercentage}%`,

          offerPrice,

          quantity: item.quantity,

          size: item.size || "",

          totalPrice:
            offerPrice * item.quantity,

          estimatedDelivery:
            getEstimatedDeliveryDate(),
        };
      }),
    };
  }),

  itemsCount,

  priceDetails: {
    ...cart.priceDetails,

    savingsMessage:
      cart.priceDetails.discount > 0
        ? `You will save ₹${cart.priceDetails.discount} on this order`
        : null,
  },

  coupon: cart.coupon || null,
};

    return res.json({
      success: true,
      cart: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= ADD TO CART ================= */
exports.addToCart = async (req, res) => {
  try {
    const { sellerInventoryId, quantity, size } = req.body;

    const qty = Number(quantity);

    const inventory = await SellerInventory.findById(
      sellerInventoryId
    ).populate("seller", "firstName lastName");

    if (!inventory || !inventory.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    if (inventory.quantity < qty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const { offerPrice } = getOfferDetails(inventory);

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user._id,
        sellerGroups: [],
        priceDetails: {
          price: 0,
          discount: 0,
          couponDiscount: 0,
          platformFee: 0,
          totalAmount: 0,
        },
      });
    }

    let sellerGroup = cart.sellerGroups.find(
      (s) =>
        s.sellerId.toString() ===
        inventory.seller._id.toString()
    );

    if (!sellerGroup) {
      cart.sellerGroups.push({
        sellerId: inventory.seller._id,
        sellerName: `${inventory.seller.firstName} ${inventory.seller.lastName}`,
        items: [],
        sellerTotal: 0,
      });

      sellerGroup =
        cart.sellerGroups[cart.sellerGroups.length - 1];
    }

    const existingItem = sellerGroup.items.find(
      (item) =>
        item.sellerInventoryId.toString() ===
          sellerInventoryId &&
        (item.size || "") === (size || "")
    );

    if (existingItem) {
      const newQty = existingItem.quantity + qty;

      if (newQty > inventory.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${inventory.quantity} items available`,
        });
      }

      existingItem.quantity = newQty;
      existingItem.totalPrice = offerPrice * newQty;
    } else {
      sellerGroup.items.push({
        sellerInventoryId,
        quantity: qty,
        size: size || "",
        totalPrice: offerPrice * qty,
      });
    }

    await cart.populate({
  path: "sellerGroups.items.sellerInventoryId",
  select: "price discountPrice",
});
    calculateCartTotals(cart);

    await cart.save();

    return res.json({
      success: true,
      message: "Added to cart",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.removeCartItem = async (req, res) => {
  try {
    const { cartItemId } = req.body;

    const cart = await Cart.findOne({
      userId: req.user._id,
    }).populate({
      path: "sellerGroups.items.sellerInventoryId",
      select: "price discountPrice",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    cart.sellerGroups = cart.sellerGroups
      .map((seller) => {
        seller.items = seller.items.filter(
          (item) => item._id.toString() !== cartItemId
        );

        return seller;
      })
      .filter((seller) => seller.items.length > 0);

    calculateCartTotals(cart);

    await cart.save();

    return res.json({
      success: true,
      message: "Item removed successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ================= ADD COUPON ================= */
 
exports.addCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      discount,
      minOrderValue,
      maxDiscount,
      description,
      expiryDate,
      usageLimit,
    } = req.body;

    // 1. Validate required fields
    if (!code || !type || !discount) {
      return res.status(400).json({
        success: false,
        message: "code, type, and discount are required",
      });
    }

    // 2. Check duplicate coupon
    const existing = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Coupon already exists",
      });
    }

    // 3. Create coupon
    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      discount,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || null,
      description: description || "",
      expiryDate: expiryDate || null,
      usageLimit: usageLimit || null,
      isActive: true,
      usedCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const formatCartResponse = (cart) => {
  let itemsCount = 0;
  const formatDeliveryTo = (deliveryTo) => {
  if (!deliveryTo?.city || !deliveryTo?.pincode) return null;

  return `${deliveryTo.city} - ${deliveryTo.pincode}`;
};

const getDeliveryMessage = (price) => {
  if (!price) return null;

  return price >= 500
    ? "Free Delivery"
    : "Delivery Charges Applicable";
};

  return {
    _id: cart._id,
    userId: cart.userId,

    deliveryTo: formatDeliveryTo(cart.deliveryTo),
    deliveryMessage: getDeliveryMessage(cart.priceDetails.price),

    itemsCount: 0,

    sellerGroups: cart.sellerGroups.map((seller) => {
      return {
        sellerId: seller.sellerId,
        sellerName: seller.sellerName,
        sellerTotal: seller.sellerTotal,

        items: seller.items.map((item) => {
          const inventory = item.sellerInventoryId;

          itemsCount += item.quantity;

          return {
            cartItemId: item._id,

            // 🔥 CONTROLLED OUTPUT ONLY
            sellerInventoryId: inventory._id,
            name: inventory.name,
            image: inventory.media?.find((m) => m.type === "image")?.url || "",
            price: inventory.price,

           offerPercentage: `${item.offerPercentage || 0}%`,
            offerPrice: item.offerPrice || 0,

            quantity: item.quantity,
            size: item.size || "",

            totalPrice: item.totalPrice,
          };
        }),
      };
    }),

    itemsCount,

    priceDetails: cart.priceDetails,
    coupon: cart.coupon || null,
    savingsMessage: cart.savingsMessage || null,
  };
};
/* ================= APPLY COUPON ================= */
 
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const cartPrice = cart.priceDetails.price;

    let discount = 0;

    if (coupon.type === "FLAT") {
      discount = coupon.discount;
    } else if (coupon.type === "PERCENT") {
      discount = Math.floor((cartPrice * coupon.discount) / 100);
    }

    const totalAmount =
      cartPrice - discount + cart.priceDetails.platformFee;

    // update ONLY coupon + price fields
    cart.coupon = {
      couponCode: coupon.code,
      couponType: coupon.type,
      couponDiscount: discount,
      applied: true,
    };

    cart.priceDetails.couponDiscount = discount;
    cart.priceDetails.totalAmount = totalAmount;

    await cart.save();
   const updatedCart = await Cart.findById(cart._id)
  .populate({
    path: "sellerGroups.items.sellerInventoryId",
    select: "name price media quantity isActive sizes"
  });

return res.json({
  success: true,
  message: "Coupon applied successfully",
  cart: formatCartResponse(updatedCart),
});
    
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
/* ================= REMOVE COUPON ================= */
 
exports.removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      userId: req.user._id,
    }).populate({
      path: "sellerGroups.items.sellerInventoryId",
      select: "price discountPrice",
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const removedCoupon = cart.coupon?.couponCode;

    cart.coupon = undefined;
    cart.priceDetails.couponDiscount = 0;

    calculateCartTotals(cart);

    await cart.save();

    return res.json({
      success: true,
      message: "Coupon removed",
      removedCoupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ================= GET  COUPON ================= */
exports.getAvailableCoupons = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    const cartValue = cart?.priceDetails?.price || 0;

    const coupons = await Coupon.find({ isActive: true });

    const result = coupons.map((c) => {
      const isAlreadyApplied = cart?.coupon?.couponCode === c.code;

      const isApplicable =
        cartValue >= c.minOrderValue &&
        !isAlreadyApplied &&
        (!c.expiryDate || c.expiryDate > new Date());

      return {
        code: c.code,
        type: c.type,
        discount: c.discount,
        minOrderValue: c.minOrderValue,
        description: c.description,

        isApplicable,

        message: isAlreadyApplied
          ? "Already Applied"
          : isApplicable
          ? "Applicable"
          : `Add ₹${c.minOrderValue - cartValue} more to use this coupon`,
      };
    });

    return res.status(200).json({
      success: true,
      coupons: result,
    });
  } catch (error) {
    return res.status(500).json({
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
 


/* ================= UPDATE CART QUANTITY ================= */
exports.updateCartQuantity = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;

    if (!cartItemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "cartItemId and quantity are required",
      });
    }

    const qty = Number(quantity);

    if (qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    let found = false;

    for (const seller of cart.sellerGroups) {
      for (const item of seller.items) {
        if (item._id.toString() === cartItemId) {

          const inventory = await SellerInventory.findById(
            item.sellerInventoryId
          );

          if (!inventory) {
            return res.status(404).json({
              success: false,
              message: "Product not found",
            });
          }

          // Stock validation
          if (qty > inventory.quantity) {
            return res.status(400).json({
              success: false,
              message: `Only ${inventory.quantity} items available in stock`,
            });
          }

          item.quantity = qty;

         const { offerPrice } = getOfferDetails(inventory);

item.totalPrice = offerPrice * qty;
          found = true;
          break;
        }
      }

      if (found) break;
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }
await cart.populate({
  path: "sellerGroups.items.sellerInventoryId",
  select: "price discountPrice",
});
    // Recalculate seller totals and cart totals
    calculateCartTotals(cart);

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ================= RELATED PRODUCTS ================= */
exports.getRelatedProducts = async (req, res) => {
  try {
    const { sellerInventoryId } = req.params;

    const currentProduct = await SellerInventory.findById(sellerInventoryId);

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const relatedProducts = await SellerInventory.find({
      subcategory: currentProduct.subcategory,
      _id: { $ne: sellerInventoryId },
      isActive: true,
    }).limit(4);

    const response = relatedProducts.map((product) => {
      const discountPercentage = product.discountPercentage || 0;

      const offerPrice =
        discountPercentage > 0
          ? product.price - (product.price * discountPercentage) / 100
          : "";

      return {
        _id: product._id,
        name: product.name,

        // ✔ image (first image only)
        image:
          product.media?.find((m) => m.type === "image")?.url || "",

        price: product.price,

        discountPercentage: `${product.discountPercentage || 0}%`, // ✅ FIXED
        offerPrice,

        sizes: product.sizes || [],
      };
    });

    return res.status(200).json({
      success: true,
      message: "Related products fetched successfully",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ================= CLEAR CART ================= */
exports.clearCart = async (req, res) => {
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

    // Remove all seller groups
    cart.sellerGroups = [];

    // Remove coupon
    cart.coupon = undefined;

    // Reset price details
    cart.priceDetails = {
      price: 0,
      discount: 0,
      couponDiscount: 0,
      platformFee: 0,
      totalAmount: 0,
    };

    // Reset delivery address (optional)
    cart.deliveryTo = undefined;

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cart,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};