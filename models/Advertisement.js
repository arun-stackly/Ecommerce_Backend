const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    image: String,

    status: {
      type: String,
      enum: ["active", "paused", "expired"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advertisement", adSchema);
