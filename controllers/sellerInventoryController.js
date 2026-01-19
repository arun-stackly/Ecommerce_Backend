const SellerInventory = require("../models/SellerInventory");

// Add inventory item
exports.createInventoryItem = async (req, res) => {
  const inventoryItem = await SellerInventory.create({
    ...req.body,
    seller: req.user._id,
  });

  res.status(201).json(inventoryItem);
};

// Get seller inventory
exports.getInventory = async (req, res) => {
  const inventory = await SellerInventory.find({
    seller: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(inventory);
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
