const mongoose = require("mongoose");

const bankDetailsSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    accountHolderName: {
      type: String,
      required: true,
    },

    bankName: {
      type: String,
      required: true,
    },

    country: {
      type: String,
      required: true,
      enum: ["India", "USA", "Others"],
    },

    // 🇮🇳 India
    ifscCode: {
      type: String,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"],
    },

    upiId: {
      type: String,
    },

    state: {
      type: String,
    },

    // 🇺🇸 USA
    routingNumber: {
      type: String,
      match: [/^\d{9}$/, "Invalid routing number"],
    },

    // 🌍 Others (EU / UK / etc.)
    iban: {
      type: String,
    },

    swiftBic: {
      type: String,
    },

    // Payment providers
    paypalEnabled: {
      type: Boolean,
      default: false,
    },

    stripeEnabled: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankDetails", bankDetailsSchema);
