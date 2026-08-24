const mongoose = require("mongoose");

const adminSettingsSchema = new mongoose.Schema(
  {
    adminName: {
      type: String,
      default: "E-Commerce Admin Panel",
      trim: true,
    },

    adminEmail: {
      type: String,
      default: "support@ecommerce.com",
      trim: true,
      lowercase: true,
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    autoApproveSellerAds: {
      type: Boolean,
      default: false,
    },

    emailAlerts: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "AdminSettings",
  adminSettingsSchema
);
