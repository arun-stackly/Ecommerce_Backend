const Order = require("../models/Order");

/* ================= CREATE ORDER ================= */
exports.createOrder = async (req, res) => {
  const order = await Order.create({
    sellerId: req.user._id, // ✅ correct field
    totalAmount: req.body.totalAmount,
    status: req.body.status || "pending",
  });

  res.status(201).json(order);
};

/* ================= GET SELLER ORDERS ================= */
exports.getOrders = async (req, res) => {
  const orders = await Order.find({
    sellerId: req.user._id, // ✅ correct field
  }).sort({ createdAt: -1 });

  res.json(orders);
};

/* ================= GET SINGLE ORDER ================= */
exports.getOrderById = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    sellerId: req.user._id, // ✅ correct field
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  res.json(order);
};

/* ================= UPDATE ORDER STATUS ================= */
exports.updateOrderStatus = async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, sellerId: req.user._id }, // ✅ correct field
    { status: req.body.status },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found or not yours",
    });
  }

  res.json(order);
};
