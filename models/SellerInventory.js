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
 
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
 
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: false,
    },
 
    subSubcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSubcategory",
      required: false,
    },
    productType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductType",
      required: false,
    },
    brand: {
      name: String,
      logo: String,
    },
 
    // Product Variants
 
    sizes: {
      type: [String],
      default: [],
    },
 
    colours: {
      type: [String],
      default: [],
    },
 
    countryOfOrigin: {
      type: String,
    },
 
    // Pricing & Quantity
    price: {
      type: Number,
      required: true,
    },
 
    discountPrice: {
      type: Number,
      default: 0,
    },
 
    returnStatus: {
      type: String,
      enum: ["returnable", "non-returnable"],
      default: "returnable",
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
    isFeatured: {
      type: Boolean,
      default: false,
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
 
        name: String,
 
        rating: Number,
 
        comment: String,
 
        images: [String],
 
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    rating: {
      type: Number,
      default: 0,
    },
 
    reviewCount: {
      type: Number,
      default: 0,
    },
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
 
    soldCount: {
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
 
 