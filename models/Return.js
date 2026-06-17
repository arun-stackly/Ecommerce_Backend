const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    returnId: {
      type: String,
      unique: true,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserOrder",
      required: true,
    },

    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
    },

      type: {
      type: String,
      default: "return",
      enum: ["return"],   // only return allowed
      required: true,
    },

    reasonCode: {
      type: String,
      required: true,
      enum: [
        "NOT_NEEDED",
        "QUALITY_ISSUE",
        "SIZE_ISSUE",
        "DAMAGED",
        "MISSING_ITEM",
        "WRONG_ITEM",
      ],
    },

    reasonText: {
      type: String,
      required: true,
    },
   pickupAddress: {
  fullName: String,
  phoneNumber: String,
  houseNo: String,
  addressLine: String,
  city: String,
  state: String,
  pincode: String,
},
    comment: {
      type: String,
      default: "",
    },

    images: [
      {
        type: String, // URLs (Cloudinary/S3)
      },
    ],

    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "pickup_scheduled",
        "picked",
        "refunded",
        "completed",
      ],
      default: "requested",
    },

    refundAmount: {
      type: Number,
      default: 0,
    },

    pickupDate: {
      type: Date,
    },

    isRefunded: {
      type: Boolean,
      default: false,
    },
    refundMode: {
  type: String,
  enum: ["STACKLY_BALANCE", "BANK_ACCOUNT"],
}
  },
  { timestamps: true }
);

/* =========================
   AUTO GENERATE RETURN ID
========================= */
returnRequestSchema.pre("save", function (next) {
  if (!this.returnId) {
    this.returnId = `RET-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model("Return", returnRequestSchema);