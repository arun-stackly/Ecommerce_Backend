const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    redirectUrl: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["homepage", "category", "subcategory", "product"],
      default: "homepage",
    },

    position: {
      type: String,
      enum: ["hero", "secondary"],
      default: "hero",
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
    },

    subSubcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSubcategory",
      default: null,
    },

    productType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductType",
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    priority: {
      type: Number,
      default: 1,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Banner", bannerSchema);