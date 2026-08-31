const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    // =========================
    // COUPON CODE
    // =========================
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // =========================
    // DISCOUNT TYPE
    // FLAT = ₹500
    // PERCENT = 20%
    // =========================
    type: {
      type: String,
      enum: ["FLAT", "PERCENT"],
      required: true,
    },

    // =========================
    // DISCOUNT VALUE
    // =========================
    discount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =========================
    // MINIMUM ORDER VALUE
    // =========================
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================
    // MAXIMUM DISCOUNT
    // Used only for percentage coupons
    // =========================
    maxDiscount: {
      type: Number,
      default: null,
      min: 0,
    },

    // =========================
    // DESCRIPTION
    // =========================
    description: {
      type: String,
      default: "",
      trim: true,
    },

    // =========================
    // START DATE
    //
    // startDate > now
    // => scheduled
    //
    // startDate <= now
    // => active (if not expired)
    // =========================
    startDate: {
      type: Date,
      default: Date.now,
    },

    // =========================
    // EXPIRY DATE
    //
    // expiryDate < now
    // => expired
    //
    // null => no expiry
    // =========================
    expiryDate: {
      type: Date,
      default: null,
    },

    // =========================
    // ENABLE / DISABLE
    //
    // false means coupon cannot be used
    // =========================
    isActive: {
      type: Boolean,
      default: true,
    },

    // =========================
    // USAGE LIMIT
    //
    // null => unlimited
    // =========================
    usageLimit: {
      type: Number,
      default: null,
      min: 0,
    },
    // Maximum times ONE customer can use this coupon
    usageLimitPerCustomer: {
      type: Number,
      default: 1,
      min: 1,
    },
    // =========================
    // HOW MANY TIMES USED
    // =========================
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// VALIDATION
// ======================================================

couponSchema.pre("validate", function (next) {
  // Percentage cannot be greater than 100
  if (
    this.type === "PERCENT" &&
    this.discount > 100
  ) {
    return next(
      new Error(
        "Percentage discount cannot be greater than 100"
      )
    );
  }

  // Expiry must be after start date
  if (
    this.startDate &&
    this.expiryDate &&
    this.expiryDate <= this.startDate
  ) {
    return next(
      new Error(
        "Expiry date must be after start date"
      )
    );
  }

  // Usage limit cannot be less than current usage
  if (
    this.usageLimit !== null &&
    this.usedCount > this.usageLimit
  ) {
    return next(
      new Error(
        "Usage limit cannot be less than used count"
      )
    );
  }

  next();
});

module.exports = mongoose.model(
  "Coupon",
  couponSchema
);
