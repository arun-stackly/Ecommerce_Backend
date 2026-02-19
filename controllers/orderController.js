const Order = require("../models/Order");
const SellerInventory = require("../models/SellerInventory");

/* ================= CREATE ORDER ================= */
exports.createOrder = async (req, res) => {
  try {
    const {
      sellerInventoryId,
      quantity = 1,
      paymentMode,
      customerName,
      customerId,
    } = req.body;

    // 1️⃣ Find inventory
    const inventory = await SellerInventory.findById(sellerInventoryId);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    // 2️⃣ Check stock
    if (quantity > inventory.quantity) {
      return res.status(400).json({
        message: "Insufficient stock available",
      });
    }

    // 3️⃣ Get first image from media array
    const imageObj = inventory.media.find((m) => m.type === "image");

    const image = imageObj ? imageObj.url : "default-product.jpg"; // fallback

    // 4️⃣ Calculate total
    const totalAmount = inventory.price * quantity;

    // 5️⃣ Create order
    const order = await Order.create({
      orderId: `ORD-${Date.now()}`,
      sellerId: inventory.seller, // ✅ correct seller
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

    // 6️⃣ Reduce stock
    inventory.quantity -= quantity;
    await inventory.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= GET SELLER ORDERS ================= */
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      sellerId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= GET SINGLE ORDER ================= */
exports.getOrderById = async (req, res) => {
  try {
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

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get Order By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ================= UPDATE ORDER STATUS ================= */
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        sellerId: req.user._id,
      },
      { status: req.body.status },
      { new: true },
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not authorized",
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      order,
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
