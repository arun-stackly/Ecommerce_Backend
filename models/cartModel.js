const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
  },
  name: String,
  price: Number,
  quantity: Number,
  totalPrice: Number,
});

const sellerGroupSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  sellerName: String,
  items: [cartItemSchema],
  sellerTotal: Number,
});

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    deliveryTo: {
      city: String,
      pincode: String,
    },

    sellerGroups: [sellerGroupSchema],

    coupon: {
      couponCode: String,
      couponType: {
        type: String,
        enum: ["FLAT", "PERCENTAGE"],
      },
      couponDiscount: {
        type: Number,
        default: 0,
      },
      applied: {
        type: Boolean,
        default: false,
      },
    },

    priceDetails: {
      price: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      couponDiscount: { type: Number, default: 0 },
      platformFee: { type: Number, default: 40 },
      totalAmount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cart", cartSchema);
