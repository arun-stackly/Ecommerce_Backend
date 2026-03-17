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
    required: true
  },


  productType: {
  type: String,
  enum: ["shirt", "tshirt", "jeans", "kurti", "top"],
  required: true
},

}, { timestamps: true });

module.exports = mongoose.model("ProductItem", ProductSchema);