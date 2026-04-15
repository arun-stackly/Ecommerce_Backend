const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  product: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Product",
  required: true
},

  slug: {
    type: String,
    required: true
  },

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
    required: false
  },


  productType: {
  type: String,
  enum: ["shirt", "tshirt", "jeans", "kurti", "top", "saree", "MenSportswear", "WomenSportswear", "KidsSportswear", "Backbags", "Handbags", "Neckwear", "Earrings",
    "Men's Sunglasses", "Women's Sunglasses", "UV Protection Sunglasses", "Casual Sunglasses", "Sports Sunglasses"
  ],
  required: true
},

}, { timestamps: true });

module.exports = mongoose.model("ProductItem", ProductSchema);