const UserOrder = require("../models/UserOrder");
const SellerInventory = require("../models/SellerInventory");
const Address = require("../models/addressModel");
const Cart = require("../models/cartModel");
const generateOrderId = require("../utils/generateOrderid");

/* =========================
   CREATE ORDER
========================= */

exports.createOrder = async (req, res) => {
  try {
    const { shippingAddressId, paymentMode } = req.body;

    const user = req.user;

    /* ================= USER CHECK ================= */
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* ================= GET CART ================= */
    const cart = await Cart.findOne({ userId: user._id });

    if (!cart || !cart.sellerGroups.length) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    /* ================= SHIPPING ADDRESS ================= */
    const shippingAddress = await Address.findById(shippingAddressId);

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: "Shipping address not found",
      });
    }

    /* ================= BILLING ADDRESS ================= */
    const billingAddress = await Address.findOne({
      userId: user._id,
      isDefault: true,
    });

    if (!billingAddress) {
      return res.status(400).json({
        success: false,
        message: "Please set default billing address",
      });
    }

    /* ================= ORDER ITEMS ================= */
    let orderItems = [];

    for (const sellerGroup of cart.sellerGroups) {
      for (const item of sellerGroup.items) {
        const inventory = await SellerInventory.findById(item.sellerInventoryId);

        if (!inventory || !inventory.isActive) continue;

        // size validation
        if (
          inventory.sizes?.length &&
          !inventory.sizes.includes(item.size)
        ) {
          return res.status(400).json({
            success: false,
            message: `Size not available for ${inventory.name}`,
          });
        }

        // stock check
        if (item.quantity > inventory.quantity) {
          return res.status(400).json({
            success: false,
            message: `${inventory.name} out of stock`,
          });
        }

        const itemTotal = inventory.price * item.quantity;

        orderItems.push({
          sellerId: inventory.seller,
          sellerInventoryId: inventory._id,
          name: inventory.name,
          image: inventory.media?.find((m) => m.type === "image")?.url || "",
          price: inventory.price,
          quantity: item.quantity,
          size: item.size,
          itemTotal,
          itemStatus: "placed",
        });

        // reduce stock
        await SellerInventory.findByIdAndUpdate(inventory._id, {
          $inc: { quantity: -item.quantity,
          soldCount: item.quantity  },
        });
      }
    }

    if (!orderItems.length) {
      return res.status(400).json({
        success: false,
        message: "No valid items found",
      });
    }

    /* ================= CART TOTALS ================= */
    const totalItemsPrice = cart.priceDetails.price;
    const platformFee = cart.priceDetails.platformFee;
    const discount = cart.priceDetails.discount;
    const couponDiscount = cart.priceDetails.couponDiscount;
    const totalAmount = cart.priceDetails.totalAmount;

    /* ================= DELIVERY ================= */
    const orderPlacedDate = new Date();
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    /* ================= PAYMENT DETAILS (IMPORTANT FIX) ================= */
    const paymentDetails =
      paymentMode === "COD"
        ? {
            paymentType: "Cash on Delivery",
            message: `Pay ₹${totalAmount} on delivery`,
            payableAmount: totalAmount,
            currency: "INR",
            paymentStatus: "pending",
          }
        : {
            paymentType: "Online Payment",
            message: "Payment pending confirmation",
            payableAmount: totalAmount,
            currency: "INR",
            paymentStatus: "pending",
          };

    /* ================= CREATE ORDER ================= */
    const order = await UserOrder.create({
      orderId: generateOrderId(),
      customerId: user._id,
      customerName: user.firstName,

      items: orderItems,

      shippingAddress: {
        fullName: shippingAddress.fullName,
        phoneNumber: shippingAddress.phoneNumber,
        houseNo: shippingAddress.houseNo,
        addressLine: shippingAddress.addressLine,
        city: shippingAddress.city,
        pincode: shippingAddress.pincode,
        state: shippingAddress.state,
        landmark: shippingAddress.landmark,
      },

      billingAddress: {
        fullName: billingAddress.fullName,
        phoneNumber: billingAddress.phoneNumber,
        houseNo: billingAddress.houseNo,
        addressLine: billingAddress.addressLine,
        city: billingAddress.city,
        pincode: billingAddress.pincode,
        state: billingAddress.state,
        landmark: billingAddress.landmark,
      },

      paymentMode,

      totalItemsPrice,
      platformFee,
      discount: discount + couponDiscount,
      totalAmount,

      orderPlacedDate,
      estimatedDeliveryDate,
      orderStatus: "placed",

      // ✅ STORE IN DB
      paymentDetails,
    });

    /* ================= CLEAR CART ================= */
    cart.sellerGroups = [];
    cart.priceDetails = {
      price: 0,
      discount: 0,
      couponDiscount: 0,
      platformFee: 0,
      totalAmount: 0,
    };
    cart.coupon = undefined;

    await cart.save();

    /* ================= RESPONSE ================= */
    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================
   GET ALL ORDERS (Pagination)
========================= */
exports.getOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const orders = await UserOrder.find({ customerId: req.user.id })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET SINGLE ORDER
========================= */
exports.getSingleOrder = async (req, res) => {
  try {
    const order = await UserOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   UPDATE ORDER STATUS (Admin/Seller Only)
========================= */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    // 🔒 ROLE CHECK
    if (req.user.role !== "admin" && req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update order status",
      });
    }

    const order = await UserOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.orderStatus = orderStatus;
    /* ===== UPDATE ITEM STATUS ===== */

order.items.forEach((item) => {

  item.itemStatus = orderStatus;

});

    // If delivered → set deliveredAt
    if (orderStatus === "delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================================
   ADD REVIEW
   POST /api/products/:id/review
========================================= */
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        message: "Rating is required",
      });
    }

    const inventory = await SellerInventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const review = {
      user: req.user._id,

      name: `${req.user.firstName} ${req.user.lastName}`,

      rating,

      comment: comment || "",
    };

    const newReviewCount = (inventory.reviewCount || 0) + 1;

    const totalRating =
      (inventory.reviews || []).reduce((acc, item) => acc + item.rating, 0) +
      Number(rating);

    const newRating = totalRating / newReviewCount;

    await SellerInventory.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          reviews: review,
        },

        $set: {
          reviewCount: newReviewCount,

          rating: newRating,
        },
      },
      {
        new: true,
        runValidators: false,
      },
    );

    res.status(201).json({
      success: true,
      message: "Review added",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================================
   GET PRODUCT REVIEWS
   GET /api/products/:id/reviews
========================================= */
exports.getProductReviews = async (req, res) => {
  try {
    const inventory = await SellerInventory.findById(req.params.id).select(
      "reviews rating reviewCount",
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const page = Number(req.query.page) || 1;

    const limit = Number(req.query.limit) || 5;

    const start = (page - 1) * limit;

    const end = start + limit;

    const reviews = inventory.reviews || [];

    const paginatedReviews = reviews.slice(start, end);

    res.status(200).json({
      success: true,

      reviews: paginatedReviews,

      rating: inventory.rating,

      reviewCount: inventory.reviewCount,

      currentPage: page,

      totalPages: Math.ceil(inventory.reviewCount / limit),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    const order = await UserOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // safety check
    if (!order.paymentDetails) {
      order.paymentDetails = {};
    }

    // ✅ ONLY PAYMENT STATUS UPDATE
    order.paymentDetails.paymentStatus = "paid";
    order.paymentDetails.transactionId = paymentId;

    await order.save();

    return res.json({
      success: true,
      message: "Payment marked as PAID",
      data: order,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
