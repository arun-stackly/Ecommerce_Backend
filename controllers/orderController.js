const Order = require("../models/Order");
const SellerInventory = require("../models/SellerInventory");

exports.createOrder = async (req, res) => {
  try {
    const {
      sellerInventoryId,
      quantity = 1,
      paymentMode,
      customerName,
      customerId,
    } = req.body;

    const inventory = await SellerInventory.findById(sellerInventoryId);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // ✅ FIX: get image from images array
    const image =
      inventory.images && inventory.images.length > 0
        ? inventory.images[0]
        : "";

    if (!image) {
      return res.status(400).json({
        message: "Inventory image missing. Please add image to inventory.",
      });
    }

    const totalAmount = inventory.price * quantity;

    const order = await Order.create({
      orderId: `ORD-${Date.now()}`,
      sellerId: req.user._id,
      customerId,
      customerName,
      sellerInventoryId,
      inventorySnapshot: {
        name: inventory.name,
        image: image,
        price: inventory.price,
      },
      quantity,
      paymentMode,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
/* ================= GET SELLER ORDERS ================= */
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      sellerId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= GET SINGLE ORDER ================= */
exports.getOrderById = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    sellerId: req.user._id,
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
    { _id: req.params.id, sellerId: req.user._id },
    { status: req.body.status },
    { new: true },
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found or not yours",
    });
  }

  res.json(order);
};
