const mongoose = require("mongoose");
const SellerInventory = require("../models/SellerInventory");
const Order = require("../models/Order");

// Add inventory item
exports.createInventoryItem = async (req, res) => {
  const inventoryItem = await SellerInventory.create({
    ...req.body,
    seller: req.user._id,
  });

  res.status(201).json(inventoryItem);
};

// ✅ Get seller inventory (WITH unitsSold for UI)
exports.getInventory = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const inventory = await SellerInventory.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
        },
      },
      {
        $lookup: {
          from: "orders",
          let: { productId: "$_id" },
          pipeline: [
            { $unwind: "$items" },
            {
              $match: {
                $expr: {
                  $eq: ["$items.productId", "$$productId"],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalSold: { $sum: "$items.quantity" },
              },
            },
          ],
          as: "sales",
        },
      },
      {
        $addFields: {
          unitsSold: {
            $ifNull: [{ $arrayElemAt: ["$sales.totalSold", 0] }, 0],
          },
        },
      },
      {
        $project: {
          name: 1,
          images: 1,
          price: 1,
          stock: 1,
          isActive: 1,
          unitsSold: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json({
      success: true,
      inventory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update inventory item
exports.updateInventoryItem = async (req, res) => {
  const inventoryItem = await SellerInventory.findOneAndUpdate(
    { _id: req.params.id, seller: req.user._id },
    req.body,
    { new: true },
  );

  if (!inventoryItem) {
    return res.status(404).json({ message: "Inventory item not found" });
  }

  res.json(inventoryItem);
};

// Delete inventory item
exports.deleteInventoryItem = async (req, res) => {
  const inventoryItem = await SellerInventory.findOneAndDelete({
    _id: req.params.id,
    seller: req.user._id,
  });

  if (!inventoryItem) {
    return res.status(404).json({ message: "Inventory item not found" });
  }

  res.json({ success: true, message: "Inventory item deleted" });
};
