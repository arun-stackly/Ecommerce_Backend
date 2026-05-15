const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: String,
    image: String,
    redirectUrl: String,
    type: { type: String, default: "homepage" },
    isActive: { type: Boolean, default: true },
    // ==========================================
// REQUIRED BANNER SCHEMA UPDATE
// ==========================================

category: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Category",
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);