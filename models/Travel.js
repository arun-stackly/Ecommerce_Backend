const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    image: String,
  },
  { _id: false }
);

const destinationSchema = new mongoose.Schema(
  {
    title: String,
    subtitle: String,
    image: String,
    price: Number,
  },
  { _id: false }
);
const planSchema = new mongoose.Schema(
  {
    title: String,

    tag: String, // For Travel/Day, Most Popular, Best Protection

    price: Number,

    currency: {
      type: String,
      default: "₹"
    },

    description: String,

    features: [String],

    buttonText: {
      type: String,
      default: "Choose Plan"
    }
  },
  { _id: false }
);
const benefitSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    icon: String,
  },
  { _id: false }
);

const travelHomepageSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: true,
      unique: true,
    },

    banner: {
      title: String,
      subtitle: String,
      image: String,
    },

    offers: [offerSchema],

    popularDestinations: [destinationSchema],

    benefits: [benefitSchema],
    plans: [planSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Travel", travelHomepageSchema);