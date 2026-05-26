const mongoose = require("mongoose");

const specificationSchema =
  new mongoose.Schema(
    {
      sellerInventoryId: {
        type: mongoose.Schema.Types.ObjectId,

        ref: "SellerInventory",

        required: true,

        unique: true,
      },

      specs: {
        type: Map,

        of: String,

        default: {},
      },
    },
    { timestamps: true },
  );

module.exports = mongoose.model(
  "Specification",
  specificationSchema,
);