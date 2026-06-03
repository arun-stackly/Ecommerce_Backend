const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
{
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  product: {
     type: mongoose.Schema.Types.ObjectId,
    ref: "SellerInventory",
    required: true,
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
  mediaUrl: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  adType: {
      type: String,
      enum: ["Weekend sale ads", "Monthly sale ads", "Seasonal sale ads"],
      required: true,
    },
  isActive: {
    type: Boolean,
    default: true
  }

},
{ timestamps: true }
);

module.exports = mongoose.model("Ad", adSchema);