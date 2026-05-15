const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    sellerInventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerInventory",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },
    type: {
      type: String,
      enum: [
        "weekly",
        "upcoming",
        "flash",
        "topDeal",
      ],
    },

    startDate: Date,

    endDate: Date,

    discountPercentage: Number,

    isActive: {
      type: Boolean,
      default: true,
    },
  },

  { timestamps: true }
);

module.exports =
  mongoose.models.Deal ||
  mongoose.model("Deal", dealSchema);