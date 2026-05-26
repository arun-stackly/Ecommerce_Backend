const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    adType: {
      type: String,
      enum: ["weekend", "monthly", "seasonal"],
      required: true,
    },

    mediaUrl: {
      type: String, // image or video URL
      required: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    description: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "paused", "expired"],
      default: "active",
    },

    startDate: Date,
    endDate: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Advertisement", adSchema);
