const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    reason: String,

    // ✅ NEW FIELDS (Refund Processing Page)
    returnShippingCharge: {
      type: Number,
      default: 0,
    },

    additionalRefund: {
      type: Number,
      default: 0,
    },

    note: String,

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Refund", refundSchema);
