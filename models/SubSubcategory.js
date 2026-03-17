const mongoose = require("mongoose");

const SubSubcategorySchema = new mongoose.Schema({
  name: {
    type: String,
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
  }
  

}, { timestamps: true });
SubSubcategorySchema.index(
  { category: 1, subcategory: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("SubSubcategory", SubSubcategorySchema);