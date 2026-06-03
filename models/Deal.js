const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    sellerInventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerInventory",
      required: true,
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