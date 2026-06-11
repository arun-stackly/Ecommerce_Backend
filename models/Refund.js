const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    returnRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Return",
      required: true,
      unique: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    refundMode: {
      type: String,
      enum: ["STACKLY_BALANCE", "BANK_ACCOUNT"],
      required: true,
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    refundStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed"
      ],
      default: "pending",
    },

    // Bank Details
    bankDetails: {
      accountHolderName: {
        type: String,
      },

      bankName: {
        type: String,
      },

      accountNumber: {
        type: String,
      },

      ifscCode: {
        type: String,
      },
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
  }
);

module.exports = mongoose.model(
  "Refund",
  refundSchema
);