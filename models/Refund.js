const mongoose = require("mongoose");
 
const refundSchema = new mongoose.Schema(
  {
    returnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return",
      required: false,
      unique: true,
      sparse: true,
    },
 
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserOrder",
      required: false,
    },
 
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
 
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
 
    refundMode: {
      type: String,
      enum: ["STACKLY_BALANCE", "BANK_ACCOUNT", "upi", "bank"],
      required: true,
    },
 
    refundAmount: {
      type: Number,
      default: 0,
    },
 
    refundStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "approved"],
      default: "pending",
    },
 
    reason: {
      type: String,
      default: "",
    },
 
    upiId: {
      type: String,
    },
 
    bankDetails: {
      accountHolderName: String,
      bankName: String,
      accountNumber: String,
      ifscCode: String,
    },
 
    transactionId: {
      type: String,
      default: null,
    },
 
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
 
module.exports = mongoose.model("Refund", refundSchema);
 
 