const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["weekend", "monthly", "seasonal"],
      required: true,
    },
    mediaUrl: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// 🔥 Prevent duplicate ad type per seller
adSchema.index({ seller: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Ad", adSchema);