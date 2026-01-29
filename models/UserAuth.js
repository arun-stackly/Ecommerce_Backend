const mongoose = require("mongoose");

const userAuthSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,

    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },

    otp: String,
    otpExpiry: Date,

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserAuth", userAuthSchema);
