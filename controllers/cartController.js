const Cart = require("../models/cartModel");
const Address = require("../models/addressModel");
const SellerInventory = require("../models/SellerInventory");
const Coupon = require("../models/couponModel");


function getOfferDetails(inventory, qty = 1) {
  const discount = inventory.discountPercentage || 0;

  let offerPercentage = 0;
  let offerPrice = 0;

  if (discount > 0) {
    offerPercentage = discount;
    offerPrice =
      inventory.price - (inventory.price * discount) / 100;
  }

  return {
    offerPercentage,
    offerPrice,
    finalPrice: offerPrice > 0 ? offerPrice : inventory.price,
  };
}
 
/* ================= GET CART ================= */

exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate({
      path: "sellerGroups.items.sellerInventoryId",
      select:
        "name price media seller quantity isActive sizes discountPercentage",
    });

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

      return res.status(200).json({
        success: true,
        cart: {
          sellerGroups: [],
          itemsCount: 0,
          deliveryTo: null,
          deliveryMessage: null,
          priceDetails: cart.priceDetails,
        },
      });
    }

    let itemsCount = 0;

    const formattedCart = {
      _id: cart._id,
      userId: cart.userId,
    };

    formattedCart.itemsCount = 0;

    formattedCart.sellerGroups = cart.sellerGroups.map((seller) => {
      return {
        sellerId: seller.sellerId,
        sellerName: seller.sellerName,
        sellerTotal: seller.sellerTotal,

        items: seller.items.map((item) => {
          const inventory = item.sellerInventoryId;

          const { offerPercentage, offerPrice } =
            getOfferDetails(inventory, item.quantity);

          itemsCount += item.quantity;

          return {
            cartItemId: item._id,
            sellerInventoryId: inventory._id,
            name: inventory.name,
            image:
              inventory.media?.find((m) => m.type === "image")?.url || "",
            price: inventory.price,

            offerPercentage: `${offerPercentage}%`,
            offerPrice,

            quantity: item.quantity,
            size: item.size || "",
            availableSizes: inventory.sizes || [],
            deliveryIn: "5-7 Days",

            totalPrice:
              (offerPrice > 0 ? offerPrice : inventory.price) *
              item.quantity,
          };
        }),
      };
    });

    formattedCart.itemsCount = itemsCount;

    formattedCart.deliveryTo =
      cart.deliveryTo?.city && cart.deliveryTo?.pincode
        ? `${cart.deliveryTo.city} - ${cart.deliveryTo.pincode}`
        : null;

    formattedCart.deliveryMessage =
      cart.priceDetails.price >= 500 ? "Free Delivery" : null;

    formattedCart.priceDetails = cart.priceDetails;

    const discount = cart.priceDetails?.discount || 0;

formattedCart.savingsMessage =
  discount > 0 ? `You will save ₹${discount} on this order` : null;

    return res.status(200).json({
      success: true,
      cart: formattedCart,
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

    if (!sellerInventoryId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "sellerInventoryId, quantity are required",
      });
    }

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

    const { offerPercentage, offerPrice, finalPrice } =
      getOfferDetails(inventory, qty);

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
      (s) => s.sellerId.toString() === inventory.seller._id.toString()
    );

    if (!sellerGroup) {
      cart.sellerGroups.push({
        sellerId: inventory.seller._id,
        sellerName: `${inventory.seller.firstName} ${inventory.seller.lastName}`,
        items: [],
        sellerTotal: 0,
      });

      sellerGroup = cart.sellerGroups[cart.sellerGroups.length - 1];
    }

    const existingItem = sellerGroup.items.find(
      (item) =>
        item.sellerInventoryId.toString() === sellerInventoryId &&
        (item.size || "") === (size || "")
    );

    if (existingItem) {
      existingItem.quantity += qty;
      const updated = getOfferDetails(inventory, existingItem.quantity);
      existingItem.totalPrice = updated.finalPrice * existingItem.quantity;
    } else {
      sellerGroup.items.push({
        sellerInventoryId,
        quantity: qty,
        size: size || "",
        offerPercentage: `${offerPercentage}%`,
        offerPrice,
        totalPrice: finalPrice * qty,
      });
    }

    calculateCartTotals(cart);
    await cart.save();

    const updatedCart = await Cart.findById(cart._id).populate({
      path: "sellerGroups.items.sellerInventoryId",
      select:
        "name price media seller quantity isActive sizes discountPercentage",
    });

    let itemsCount = 0;

    const discount = updatedCart.priceDetails?.discount || 0;

   const savingsMessage =
  discount > 0 ? `You will save ₹${discount} on this order` : null;

    

    const response = {
      _id: updatedCart._id,
      userId: updatedCart.userId,
      /* ================= DELIVERY ================= */
  deliveryTo:
    updatedCart.deliveryTo?.city && updatedCart.deliveryTo?.pincode
      ? `${updatedCart.deliveryTo.city} - ${updatedCart.deliveryTo.pincode}`
      : null,

  deliveryMessage:
    updatedCart.priceDetails.price >= 500
      ? "Free Delivery"
      : "Delivery Charges Applicable",

      itemsCount,
      sellerGroups: updatedCart.sellerGroups.map((seller) => {
        return {
          sellerId: seller.sellerId,
          sellerName: seller.sellerName,
          sellerTotal: seller.sellerTotal,

          items: seller.items.map((item) => {
            const inventory = item.sellerInventoryId;

            const { offerPercentage, offerPrice } =
              getOfferDetails(inventory, item.quantity);

            itemsCount += item.quantity;

            return {
              cartItemId: item._id,
              sellerInventoryId: inventory._id,
              name: inventory.name,
              image:
                inventory.media?.find((m) => m.type === "image")?.url || "",
              price: inventory.price,

              offerPercentage,
              offerPrice,

              quantity: item.quantity,
              size: item.size || "",
              totalPrice:
                (offerPrice > 0 ? offerPrice : inventory.price) *
                item.quantity,
            };
          }),
        };
      }),
      itemsCount,
      priceDetails: updatedCart.priceDetails,
      savingsMessage, 
    };
    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ================= REMOVE ITEM ================= */
exports.removeCartItem = async (req, res) => {
  try {

    const { cartItemId } = req.body;
    console.log("BODY:", req.body);

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
    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const removedCoupon = cart.coupon?.couponCode;

cart.coupon = undefined;

calculateCartTotals(cart);

await cart.save();

return res.json({
  success: true,
  message: "Coupon removed",
  removedCoupon
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

  /* ===== PRICE ===== */

  cart.priceDetails.price = totalPrice;

  /* ===== COUPON ===== */

  cart.priceDetails.couponDiscount =
    cart.coupon?.couponDiscount || 0;

  /* ===== PLATFORM FEE ===== */

  cart.priceDetails.platformFee =
    totalPrice > 0 ? 40 : 0;

  /* ===== TOTAL ===== */

  cart.priceDetails.totalAmount =
    cart.priceDetails.price -
    cart.priceDetails.discount -
    cart.priceDetails.couponDiscount +
    cart.priceDetails.platformFee;
}



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

    for (let seller of cart.sellerGroups) {
      for (let item of seller.items) {
        if (item._id.toString() === cartItemId) {
          item.quantity = qty;
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

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Quantity updated successfully",
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