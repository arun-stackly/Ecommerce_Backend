const UserOrder = require("../models/UserOrder");
const SellerInventory = require("../models/SellerInventory");
const Address = require("../models/addressModel");
const Refund = require("../models/Refund");
const Cart = require("../models/cartModel");
const generateOrderId = require("../utils/generateOrderid");
const Seller = require("../models/SellerProfile"); // adjust if different
const BankAccount = require("../models/UserBank");
const Card = require("../models/UserCard");
const Payment = require("../models/Payment");
 
/* =========================
   CREATE ORDER
========================= */
 
exports.createOrder = async (req, res) => {
  try {
   const {
  shippingAddressId,
  paymentMode,
  paymentMethodId,
   paymentId,
} = req.body;
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
   const shippingAddress = await Address.findOne({
  _id: shippingAddressId,
  userId: user._id,
});
 
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

    const inventory = await SellerInventory.findById(
      item.sellerInventoryId
    );

    if (!inventory || !inventory.isActive) continue;

    /* ================= SIZE VALIDATION ================= */

 

    /* ================= STOCK CHECK ================= */

    if (item.quantity > inventory.quantity) {
      return res.status(400).json({
        success: false,
        message: `${inventory.name} is out of stock`,
      });
    }

    const offerPrice =
      inventory.discountPrice > 0
        ? inventory.discountPrice
        : inventory.price;

    const itemTotal = offerPrice * item.quantity;

    orderItems.push({
      sellerId: inventory.seller,
      sellerInventoryId: inventory._id,
      name: inventory.name,
      image:
        inventory.media?.find((m) => m.type === "image")?.url || "",
      price: inventory.price,
      discountPrice: inventory.discountPrice || 0,
      quantity: item.quantity,
      size: item.size || "",
      itemTotal,
      itemStatus: "ordered",
    });

    // Reduce stock
    await SellerInventory.findByIdAndUpdate(
      inventory._id,
      {
        $inc: {
          quantity: -item.quantity,
          soldCount: item.quantity,
        },
      }
    );
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
    let paymentDetails = {};
   /* ================= PAYMENT MODE VALIDATION ================= */

const validModes = ["COD", "UPI", "CARD", "BANK"];

if (!validModes.includes(paymentMode)) {
  return res.status(400).json({
    success: false,
    message: "Invalid payment mode",
  });
}

if (
  ["UPI", "CARD", "BANK"].includes(paymentMode) &&
  !paymentMethodId
) {
  return res.status(400).json({
    success: false,
    message: "paymentMethodId is required",
  });
}

if (
  ["UPI", "CARD", "BANK"].includes(paymentMode) &&
  !paymentId
) {
  return res.status(400).json({
    success: false,
    message: "paymentId is required",
  });
}

/* ================= VERIFY PAYMENT ================= */

let payment = null;

if (paymentMode !== "COD") {
  payment = await Payment.findOne({
    _id: paymentId,
    customerId: user._id,
  });

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  if (payment.method !== paymentMode) {
    return res.status(400).json({
      success: false,
      message: "Payment method mismatch",
    });
  }

  if (payment.status !== "success") {
    return res.status(400).json({
      success: false,
      message: "Payment not completed",
    });
  }

  const existingOrder = await UserOrder.findOne({
    paymentId: payment._id,
  });

  if (existingOrder) {
    return res.status(400).json({
      success: false,
      message: "Order already created for this payment",
    });
  }
}

if (paymentMode === "COD") {
  paymentDetails = {
    paymentType: "Cash on Delivery",
    message: `Pay in cash  ₹${totalAmount} when your order is delivered`,
    payableAmount: totalAmount,
    currency: "INR",
    paymentStatus: "pending",
  };
}

else if (paymentMode === "UPI") {
  const bankAccount = await BankAccount.findOne({
    _id: paymentMethodId,
    user: user._id,
  });

  if (!bankAccount || !bankAccount.upiId) {
    return res.status(404).json({
      success: false,
      message: "UPI account not found",
    });
  }

  paymentDetails = {
    paymentType: "UPI",
    upiId: bankAccount.upiId,
    payableAmount: totalAmount,
    transactionId: payment.transactionId,
    currency: "INR",
    paymentStatus:
  payment?.status === "success"
    ? "paid"
    : "pending",
    message: `Pay using ${bankAccount.upiId}`,
  };
}

else if (paymentMode === "CARD") {
  const card = await Card.findOne({
    _id: paymentMethodId,
    user: user._id,
  });

  if (!card) {
    return res.status(404).json({
      success: false,
      message: "Card not found",
    });
  }

  paymentDetails = {
    paymentType: "Card",
    cardHolderName: card.cardHolderName,
    cardNumber: `XXXX-XXXX-${card.cardNumber.slice(-4)}`,
    transactionId: payment.transactionId,
    payableAmount: totalAmount,
    currency: "INR",
    paymentStatus:
  payment?.status === "success"
    ? "paid"
    : "pending",
    message: "Payment Completed",
  };
}

else if (paymentMode === "BANK") {
  const bankAccount = await BankAccount.findOne({
    _id: paymentMethodId,
    user: user._id,
  });

  if (!bankAccount) {
    return res.status(404).json({
      success: false,
      message: "Bank account not found",
    });
  }

  paymentDetails = {
    paymentType: "Bank Transfer",
    bankName: bankAccount.bankName,
    accountNumber: `XXXX${bankAccount.accountNumber.slice(-4)}`,
    ifscCode: bankAccount.ifscCode,
    transactionId: payment.transactionId,
    payableAmount: totalAmount,
    currency: "INR",
    paymentStatus:
  payment?.status === "success"
    ? "paid"
    : "pending",
    message: "Payment Completed",
  };
}

else {
  return res.status(400).json({
    success: false,
    message: "Invalid payment mode",
  });
}
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
 
      orderPlacedDate: {
  type: Date,
  default: Date.now,
},
      estimatedDeliveryDate,
      orderStatus: "ordered",
 
      // ✅ STORE IN DB
      paymentId: payment?._id,
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


exports.getOrders = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const orders = await UserOrder.find({
      customerId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "_id orderId orderStatus createdAt items shippingAddress billingAddress estimatedDeliveryDate paymentMode"
      );

    const formattedOrders = await Promise.all(
      orders.map(async (order) => {
        const itemsWithReviews = await Promise.all(
          order.items.map(async (item) => {
           

            let product = null;

            if (item.sellerInventoryId) {
              product = await SellerInventory.findById(
  item.sellerInventoryId
).select("reviews rating reviewCount");
            }

           

            return {
              itemId: item._id,
              productId: item.sellerInventoryId|| null,
              name: item.name,
              image: item.image,
              quantity: item.quantity,
              size: item.size,
              price: item.price,
              itemStatus: item.itemStatus,

              rating: product?.rating || 0,
              reviewCount: product?.reviewCount || 0,
              reviews: product?.reviews || [],
            };
          })
        );

        return {
          _id: order._id,
          orderId: order.orderId,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          estimatedDeliveryDate: order.estimatedDeliveryDate,
          paymentMode: order.paymentMode,
          shippingAddress: order.shippingAddress,
          billingAddress: order.billingAddress,
          items: itemsWithReviews,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: formattedOrders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
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
 
exports.getSingleOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    const order = await UserOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const item = order.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    let rating = 0;

    if (item.sellerInventoryId) {
      const product = await SellerInventory.findById(
        item.sellerInventoryId
      ).select("rating");

      rating = product?.rating || 0;
    }

    return res.json({
      success: true,
      data: {
        orderId: order.orderId,
        orderStatus: order.orderStatus,
        estimatedDeliveryDate: order.estimatedDeliveryDate,

        item,

        rating, // rating from SellerInventory
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================
   UPDATE ORDER STATUS (Admin/Seller Only)
========================= */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;

    if (
      req.user.role !== "admin" &&
      req.user.role !== "seller"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You are not authorized to update order status",
      });
    }

    const order = await UserOrder.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const validStatuses = [
      "ordered",
      "shipped",
      "delivered",
      "cancelled",
      "exchange",
      "return",
    ];

    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    order.orderStatus = orderStatus;

    order.items.forEach((item) => {
      item.itemStatus = orderStatus;
    });

    if (orderStatus === "delivered") {
      order.paymentDetails.deliveredAt =
        new Date();
    }

    if (orderStatus === "cancelled") {
      order.cancelledAt = new Date();
    }

    await order.save();

    return res.json({
      success: true,
      message:
        "Order status updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
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
    const { rating, comment, images } = req.body;
 
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
 
      images: Array.isArray(images) ? images : [],
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

exports.getOrderInvoice = async (req, res) => {
  try {
    const { id } = req.params;
 
    const order = await UserOrder.findById(id);
 
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
 
    // Only delivered orders can have invoices
    if (order.orderStatus !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Invoice is available only for delivered orders",
      });
    }
 
    /* ================= SELLER INFO ================= */
 
    const seller = await Seller.findById(order.items?.[0]?.sellerId);
 
    /* ================= TAX CALCULATION ================= */
 
    const grossAmount = order.totalItemsPrice || 0;
 
    // Adjust if GST is actually stored separately
    const cgst = 0;
    const sgst = 0;
    const igst = 0;
 
    const taxAmount = cgst + sgst + igst;
 
    const totalInvoiceValue = order.totalAmount || 0;
 
    /* ================= ITEMS ================= */
 
    const invoiceItems = order.items.map((item) => ({
      productName: item.name,
      quantity: item.quantity,
      grossAmount: item.itemTotal,
      taxableValue: item.itemTotal,
      cgst: 0,
      sgst: 0,
      total: item.itemTotal,
      size: item.size,
    }));
 
    /* ================= INVOICE RESPONSE ================= */
 
    const invoice = {
      invoiceNumber: `INV-${Date.now()}`,
      orderId: order.orderId,
 
      orderDate: order.orderPlacedDate,
      invoiceDate: order.deliveredAt || new Date(),
 
      seller: {
        name: seller?.storeName || "Stackly",
        address: seller?.address || "",
        gstin: seller?.gstin || "",
      },
 
      customer: {
        name: order.customerName,
        id: order.customerId,
      },
 
      billingAddress: order.billingAddress,
      shippingAddress: order.shippingAddress,
 
      items: invoiceItems,
 
      totals: {
        grossAmount,
        taxableValue: grossAmount,
        cgst,
        sgst,
        igst,
        taxAmount,
        totalInvoiceValue,
        totalAmountInWords: `${totalInvoiceValue} Rupees Only`,
      },
 
      delivery: {
        status: order.orderStatus,
        deliveredAt: order.deliveredAt || new Date(),
        estimatedDeliveryDate: order.estimatedDeliveryDate || null,
      },
    };
 
    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
exports.cancelOrder = async (req, res) => {
  try {
    const order = await UserOrder.findById(req.params.id);
 
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
 
    if (order.orderStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order already cancelled",
      });
    }
 
    if (order.orderStatus === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled",
      });
    }
 
   // Cancel Order
order.orderStatus = "cancelled";
order.cancelledAt = new Date();

// Restore stock
for (const item of order.items) {
  const inventory = await SellerInventory.findById(
    item.sellerInventoryId
  );

  if (inventory) {
    inventory.quantity += item.quantity;

    inventory.soldCount = Math.max(
      0,
      (inventory.soldCount || 0) - item.quantity
    );

    await inventory.save();
  }

  item.itemStatus = "cancelled";
}
  
 
    // Cancel all items
    order.items.forEach((item) => {
      item.itemStatus = "cancelled";
    });
 
    /* =========================
       PREPAID REFUND CREATION
    ========================= */
 
    if (order.paymentMode !== "COD") {
      const existingRefund = await Refund.findOne({
        orderId: order._id,
      });
 
      if (!existingRefund) {
        await Refund.create({
          sellerId: order.items[0].sellerId,
          orderId: order._id,
          amount: order.totalAmount,
          reason: "Order Cancelled",
          status: "approved",
        });
      }
    }
 
    await order.save();
 
    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
exports.getCancelledCODOrder = async (req, res) => {
  try {
    const order = await UserOrder.findById(req.params.id);
 
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
 
    if (order.paymentMode !== "COD") {
      return res.status(400).json({
        success: false,
        message: "Not a COD order",
      });
    }
 
    res.status(200).json({
      success: true,
 
      orderId: order.orderId,
 
      product: {
        name: order.items[0]?.name,
        image: order.items[0]?.image,
        size: order.items[0]?.size,
        quantity: order.items[0]?.quantity,
      },
 
      orderPlacedDate: order.createdAt,
 
      cancelledDate: order.cancelledAt,
 
      paymentMode: order.paymentMode,
 
      paymentDetails: {
        title: "COD - Cash on Delivery",
        message: `Pay in cash of ₹${order.totalAmount} when your order is delivered.`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
exports.getCancelledPrepaidOrder = async (req, res) => {
  try {
    const order = await UserOrder.findById(req.params.id);
 
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
 
    if (order.paymentMode === "COD") {
      return res.status(400).json({
        success: false,
        message: "This is not a prepaid order",
      });
    }
 
    const refund = await Refund.findOne({
      orderId: order._id,
    });
 
    res.status(200).json({
      success: true,
 
      orderId: order.orderId,
 
      refundStatus: refund?.status || "pending",
 
      product: {
        name: order.items[0]?.name,
        image: order.items[0]?.image,
        size: order.items[0]?.size,
        quantity: order.items[0]?.quantity,
      },
 
      paymentMode: order.paymentMode,
 
      orderPlacedDate: order.createdAt,
 
      cancelledDate: order.cancelledAt,
 
      paymentDetails: {
        title: `${order.paymentMode} Payment`,
        message: "Your payment was refunded to your bank account.",
      },
 
      refund: {
        amount: refund?.amount || 0,
        status: refund?.status || "pending",
        reason: refund?.reason || "",
        refundDate: refund?.updatedAt || null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
exports.getOrdersByStatusWithItems = async (req, res) => {
  try {
    const { status } = req.params;

    // Step 1: Check all orders in DB
    const totalOrders = await UserOrder.countDocuments();
    console.log("Total Orders In DB:", totalOrders);

    // Step 2: Check orders for current user
    const userOrders = await UserOrder.find({
      customerId: req.user._id,
    }).select("orderId customerId orderStatus");

    console.log("=================================");
    console.log("Orders For Current User:", userOrders.length);

    userOrders.forEach((order) => {
      console.log({
        orderId: order.orderId,
        customerId: order.customerId.toString(),
        orderStatus: order.orderStatus,
      });
    });

  

    // Step 3: Apply filter
    const filter = {
  customerId: req.user._id,
};

if (status) {
  const statusMap = {
    ordered: "placed",
  };

  filter.orderStatus = statusMap[status] || status;
}


    const orders = await UserOrder.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "_id orderId orderStatus createdAt items estimatedDeliveryDate deliveredAt shippingAddress paymentMode"
      );

    console.log("Filtered Orders Found:", orders.length);

    const formatted = orders.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      orderStatus: order.orderStatus,
      createdAt: order.createdAt,
      estimatedDeliveryDate: order.estimatedDeliveryDate,
      deliveredAt: order.deliveredAt,
      paymentMode: order.paymentMode,
      shippingAddress: order.shippingAddress,

      products: order.items.map((item) => ({
        itemId: item._id,
        productId: item.sellerInventoryId,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
        itemStatus: item.itemStatus,
      })),
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};