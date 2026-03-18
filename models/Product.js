const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
      },
    
      subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
        required: true
      },
    
      subSubcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSubcategory",
        required: true
      },
    subCategory: String,
     brands: [
  {
    name: { type: String, required: true },
    logo: { type: String }
  }
],
    priceRanges: { type: [String], default: [] },
    discountPrice: Number,
    reviews: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String },
  },
],
   sizes: [
    {
      size: String,
      quantity: Number
    }
  ],
    reviewCount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    payOnDelivery: { type: Boolean, default: true },
    images: [String],
    isFeatured: { type: Boolean, default: false },
    status: { type: String, default: "active" }
  },
  { timestamps: true }
);

// Indexes for performance
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ discountPrice: 1 });

module.exports = mongoose.model("Product", productSchema);