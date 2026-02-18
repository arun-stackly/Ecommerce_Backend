const mongoose = require("mongoose");

const sellerInventorySchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Product Basic Info
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
    },

    // ✅ Updated Category (Enum)
    category: {
      type: String,
      required: true,
      enum: [
        "New Arrivals",
        "Electronics",
        "Fashion",
        "Accessories",
        "Appliances",
        "Travel Booking",
        "Food and Grocery",
      ],
    },

    // Product Variants
    size: {
      type: String,
    },

    colour: {
      type: String,
    },

    countryOfOrigin: {
      type: String,
    },

    // Pricing & Quantity
    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      default: 0,
    },

    // Media (Images or Videos)
    media: [
      {
        url: String,
        type: {
          type: String,
          enum: ["image", "video"],
          default: "image",
        },
      },
    ],

    // Compliance Section
    compliance: {
      notHazardous: {
        type: Boolean,
        default: false,
      },
      regulationConfirmed: {
        type: Boolean,
        default: false,
      },
    },

    // System Fields
    views: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Prevent OverwriteModelError
module.exports =
  mongoose.models.SellerInventory ||
  mongoose.model("SellerInventory", sellerInventorySchema);
