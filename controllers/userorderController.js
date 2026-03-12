const UserOrder = require("../models/UserOrder");
const SellerInventory = require("../models/SellerInventory");
const Address = require("../models/addressModel");
const UserAuth = require("../models/UserAuth");
const generateOrderId = require("../utils/generateOrderid");

/* =========================
   CREATE ORDER
========================= */
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddressId, paymentMode } = req.body;

    const user = req.user;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /* ======================
       SHIPPING ADDRESS
    ====================== */

    const shippingAddress = await Address.findById(shippingAddressId);

    if (!shippingAddress) {
      return res.status(404).json({ message: "Shipping address not found" });
    }

    /* ======================
       BILLING ADDRESS
       (DEFAULT ADDRESS)
    ====================== */

    const billingAddress = await Address.findOne({
      userId: user._id,
      isDefault: true,
    });

    if (!billingAddress) {
      return res.status(400).json({
        message: "Please set default address for billing",
      });
    }

    /* ======================
       ORDER ITEMS
    ====================== */

    let orderItems = [];
    let totalItemsPrice = 0;

    for (let item of items) {
      const inventory = await SellerInventory.findById(
        item.sellerInventoryId
      ).populate("seller");

      if (!inventory) continue;

      const itemTotal = inventory.price * item.quantity;
      totalItemsPrice += itemTotal;

      orderItems.push({
        sellerId: inventory.seller,
        sellerInventoryId: inventory._id,
        productId: inventory.productId,
        name: inventory.name,
        image: inventory.media?.[0]?.url || "",
        price: inventory.price,
        quantity: item.quantity,
        itemTotal,
      });
    }

    /* ======================
       TOTAL CALCULATION
    ====================== */

    const platformFee = 10;
    const totalAmount = totalItemsPrice + platformFee;

 /* ======================
       ESTIMATEING DELIVERY DATE
    ====================== */
    const estimatedDeliveryDate = new Date();
estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    /* ======================
       CREATE ORDER
    ====================== */

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
      totalAmount,
      estimatedDeliveryDate,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
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