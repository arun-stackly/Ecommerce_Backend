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
    const {
      shippingAddressId,
      paymentMode,
    } = req.body;

    const user = req.user;

    /* ======================
       USER CHECK
    ====================== */

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* ======================
       GET USER CART
    ====================== */

    const cart = await Cart.findOne({
      userId: user._id,
    });

    if (
      !cart ||
      !cart.sellerGroups.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    /* ======================
       SHIPPING ADDRESS
    ====================== */

    const shippingAddress =
      await Address.findById(
        shippingAddressId,
      );

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message:
          "Shipping address not found",
      });
    }

    /* ======================
       BILLING ADDRESS
    ====================== */

    const billingAddress =
      await Address.findOne({
        userId: user._id,
        isDefault: true,
      });

    if (!billingAddress) {
      return res.status(400).json({
        success: false,
        message:
          "Please set default billing address",
      });
    }

    /* ======================
       ORDER ITEMS
    ====================== */

    let orderItems = [];

    for (const sellerGroup of cart.sellerGroups) {
      for (const item of sellerGroup.items) {

        /* ===== INVENTORY ===== */

        const inventory =
          await SellerInventory.findById(
            item.sellerInventoryId,
          );

        if (!inventory) {
          continue;
        }

        /* ===== ACTIVE CHECK ===== */

        if (!inventory.isActive) {
          continue;
        }

        /* ===== STOCK CHECK ===== */

        if (
          item.quantity >
          inventory.quantity
        ) {
          return res.status(400).json({
            success: false,
            message: `${inventory.name} out of stock`,
          });
        }

        /* ===== ITEM TOTAL ===== */

        const itemTotal =
          inventory.price *
          item.quantity;

        /* ===== PUSH ORDER ITEM ===== */

        orderItems.push({
          sellerId: inventory.seller,

          sellerInventoryId:
            inventory._id,

          name: inventory.name,

          image:
            inventory.media?.find(
              (m) => m.type === "image",
            )?.url || "",

          price: inventory.price,

          quantity: item.quantity,

          itemTotal,
        });

        /* ===== REDUCE STOCK ===== */

        inventory.quantity -=
          item.quantity;

        await inventory.save();
      }
    }

    /* ======================
       EMPTY ITEMS CHECK
    ====================== */

    if (orderItems.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No valid inventory items found",
      });
    }

    /* ======================
       CART TOTALS
    ====================== */

    const totalItemsPrice =
      cart.priceDetails.price;

    const platformFee =
      cart.priceDetails.platformFee;

    const discount =
      cart.priceDetails.discount;

    const couponDiscount =
      cart.priceDetails.couponDiscount;

    const totalAmount =
      cart.priceDetails.totalAmount;

    /* ======================
       ESTIMATED DELIVERY
    ====================== */

    const estimatedDeliveryDate =
      new Date();

    estimatedDeliveryDate.setDate(
      estimatedDeliveryDate.getDate() + 5,
    );

    /* ======================
       CREATE ORDER
    ====================== */

    const order =
      await UserOrder.create({
        orderId: generateOrderId(),

        customerId: user._id,

        customerName:
          user.firstName,

        items: orderItems,

        shippingAddress: {
          fullName:
            shippingAddress.fullName,

          phoneNumber:
            shippingAddress.phoneNumber,

          houseNo:
            shippingAddress.houseNo,

          addressLine:
            shippingAddress.addressLine,

          city: shippingAddress.city,

          pincode:
            shippingAddress.pincode,

          state:
            shippingAddress.state,

          landmark:
            shippingAddress.landmark,
        },

        billingAddress: {
          fullName:
            billingAddress.fullName,

          phoneNumber:
            billingAddress.phoneNumber,

          houseNo:
            billingAddress.houseNo,

          addressLine:
            billingAddress.addressLine,

          city:
            billingAddress.city,

          pincode:
            billingAddress.pincode,

          state:
            billingAddress.state,

          landmark:
            billingAddress.landmark,
        },

        paymentMode,

        totalItemsPrice,

        platformFee,

        discount:
          discount +
          couponDiscount,

        totalAmount,

        estimatedDeliveryDate,
      });

    /* ======================
       CLEAR CART
    ====================== */

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

    /* ======================
       RESPONSE
    ====================== */

    res.status(201).json({
      success: true,

      message:
        "Order created successfully",

      data: order,
    });

  } catch (error) {
    res.status(500).json({
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