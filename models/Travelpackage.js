const mongoose = require("mongoose");

const travelPackageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
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
    description: String,

    destination: String,

    duration: String, // e.g. "5 Nights 6 Days"

    price: {
      type: Number,
      required: true,
    },

    discountPrice: Number,

    discountPercentage: Number,

    images: [String],

   brand: {
  name: String,
  logo: String
},
    isLatest: {
      type: Boolean,
      default: false,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TravelPackage", travelPackageSchema);