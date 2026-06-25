const mongoose = require("mongoose");

const specificationSchema = new mongoose.Schema(
  {
    sellerInventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerInventory",
      required: true,
      unique: true,
    },

    productTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductType",
      required: true,
    },

    specifications: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Specification",
  specificationSchema
);