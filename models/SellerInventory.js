const mongoose = require("mongoose");

const sellerInventorySchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    category: String,
    images: [String],
    views: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// 🔐 Prevent OverwriteModelError
module.exports =
  mongoose.models.SellerInventory ||
  mongoose.model("SellerInventory", sellerInventorySchema);
