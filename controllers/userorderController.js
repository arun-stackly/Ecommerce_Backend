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
    const { items, addressId, paymentMode } = req.body;

    const user = req.user; // ✅ Use middleware user directly
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = await Address.findById(addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

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
  sellerId: inventory.seller, // populated user object
  sellerInventoryId: inventory._id,
  productId: inventory.productId, // or null if you want product id separately
  name: inventory.name,
  image: inventory.media?.[0]?.url || "", // first media url or empty string
  price: inventory.price,
  quantity: item.quantity,
  itemTotal,
});
    }

    const platformFee = 10;
    const totalAmount = totalItemsPrice + platformFee;

    const order = await UserOrder.create({
      orderId: generateOrderId(),
      customerId: user._id,
      customerName: user.firstName,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phoneNumber: address.phoneNumber,
        houseNo: address.houseNo,
        addressLine: address.addressLine,
        city: address.city,
        pincode: address.pincode,
        state: address.state,
        landmark: address.landmark,
      },
      paymentMode,
      totalItemsPrice,
      platformFee,
      totalAmount,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ message: error.message });
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