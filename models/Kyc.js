const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    idProof: {
      type: String,
      required: true,
    },

    businessProof: {
      type: String,
    },

    additionalDocument: {
      type: String,
    },

    isIndividualSeller: {
      type: Boolean,
      default: false,
    },

    isConfirmed: {
      type: Boolean,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Kyc", kycSchema);
