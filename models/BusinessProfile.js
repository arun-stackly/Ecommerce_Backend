const mongoose = require("mongoose");

const businessProfileSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    profileImage: {
      type: String, // Cloudinary or image URL
    },

    businessEmail: {
      type: String,
    },

    supportEmail: {
      type: String,
    },

    supportPhone: {
      type: String,
    },

    language: {
      type: String,
      default: "English",
    },

    timeZone: {
      type: String,
      default: "GMT+5:30",
    },

    nationality: {
      type: String,
      default: "Indian",
    },

    merchantId: {
      type: String,
    },

    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BusinessProfile", businessProfileSchema);
