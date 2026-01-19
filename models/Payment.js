const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
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
    amount: Number,
    method: String,
    status: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
