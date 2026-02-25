const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    type: {
      type: String,
      enum: ["weekly", "upcoming", "flash"],
    },
    startDate: Date,
    endDate: Date,
    discountPercentage: Number,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Deal", dealSchema);