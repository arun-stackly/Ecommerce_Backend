const mongoose = require("mongoose");

const businessInfoSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    businessPersonName: {
      type: String,
      required: true,
      trim: true,
    },

    businessName: {
      type: String,
      required: true,
      trim: true,
    },

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

    // GST / PAN / Business Tax ID
    businessTaxId: {
      type: String,
      required: true,
      trim: true,
    },

    // ✅ NEW: Business Registration Number
    businessRegistrationNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^[A-Z]{2}\d{12}$/, "Invalid registration number format"],
      // Example: XY220150403095
    },

    // Address
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },

    city: { type: String, required: true },
    state: { type: String, required: true },

    country: {
      type: String,
      default: "India",
    },

    postalCode: {
      type: String,
      required: true,
      match: [/^[1-9][0-9]{5}$/, "Invalid Indian PIN code"],
    },

    // ✅ NEW: Language
    languages: {
      type: [String],
      enum: ["Hindi", "English"],
      default: ["English"],
    },

    // ✅ NEW: Time Zone
    timeZone: {
      type: String,
      default: "GMT+5:30 (New Delhi)",
    },

    // ✅ NEW: Nationality
    nationality: {
      type: String,
      default: "Indian",
    },

    isCompleted: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BusinessInfo", businessInfoSchema);
