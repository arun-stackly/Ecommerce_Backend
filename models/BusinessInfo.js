const mongoose = require("mongoose");

const businessInfoSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    businessPersonName: { type: String, required: true },
    businessName: { type: String, required: true },

    contactNumber: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, "Invalid Indian mobile number"],
    },

    businessType: {
      type: String,
      enum: [
        "Individual",
        "Proprietorship",
        "Partnership",
        "Private Limited",
        "Others",
      ],
      required: true,
    },

    businessTaxId: { type: String, required: true },

    addressLine1: { type: String, required: true },
    addressLine2: { type: String },

    city: { type: String, required: true },
    state: { type: String, required: true },

    country: { type: String, default: "India" },

    postalCode: {
      type: String,
      required: true,
      match: [/^[1-9][0-9]{5}$/, "Invalid Indian PIN code"],
    },

    isCompleted: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BusinessInfo", businessInfoSchema);
