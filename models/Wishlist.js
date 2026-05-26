const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    items: [
      {
        sellerInventoryId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SellerInventory",
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Wishlist",
  wishlistSchema
);