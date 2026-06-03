const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
{
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  productName: {
    type: String,
    required: true
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
      enum: ["weekend", "monthly", "seasonal"],
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