
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    
    orderId: {
      type: String,
      required: true,
      unique: true,
    },

  
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Customer
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    // Seller Inventory reference
    sellerInventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerInventory",
      required: true,
    },

    // Snapshot (VERY IMPORTANT)
    inventorySnapshot: {
      name: { type: String, required: true },
      image: { type: String, required: true },
      price: { type: Number, required: true },
      sku: { type: String },
    },

    quantity: {
      type: Number,
      default: 1,
    },

    paymentMode: {
      type: String,
      enum: ["COD", "Prepaid", "UPI", "Card", "NetBanking"],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },

    orderDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

