const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    category: { type: String, index: true },
    subCategory: String,
    brand: { type: String, index: true },
    price: { type: Number, required: true },
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
  
    reviewCount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    payOnDelivery: { type: Boolean, default: true },
    images: [String],

    isFeatured: { type: Boolean, default: false },
    isTopDeal: { type: Boolean, default: false },
    isUpcoming: { type: Boolean, default: false },
    dealEndTime: Date,

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