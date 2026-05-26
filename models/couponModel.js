const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["FLAT", "PERCENT"],
      required: true,
    },

    discount: {
      type: Number,
      required: true,
    },

    minOrderValue: {
      type: Number,
      default: 0,
    },

    maxDiscount: {
      type: Number, // only for percent coupons
    },

    description: String,

    expiryDate: {
      type: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    usageLimit: {
      type: Number,
      default: null, // null = unlimited
    },

    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);