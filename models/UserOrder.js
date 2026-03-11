const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sellerInventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SellerInventory",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  itemTotal: { type: Number, required: true },
  itemStatus: {
    type: String,
    enum: ["placed", "shipped", "delivered", "cancelled"],
    default: "placed",
  },
});

const userOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerName: { type: String, required: true },

    items: [orderItemSchema],

    shippingAddress: {
      fullName: String,
      phoneNumber: String,
      houseNo: String,
      addressLine: String,
      city: String,
      pincode: String,
      state: String,
      landmark: String,
    },
    billingAddress: {
      fullName: String,
      phoneNumber: String,
      houseNo: String,
      addressLine: String,
      city: String,
      pincode: String,
      state: String,
      landmark: String,
    },
    paymentMode: {
      type: String,
      enum: ["COD", "Prepaid", "UPI", "Card", "NetBanking"],
      required: true,
    },

    totalItemsPrice: Number,
    platformFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: Number,
    estimatedDeliveryDate: {
      type: Date,
    },

    orderStatus: {
      type: String,
      enum: [
        "placed",
        "partially_shipped",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserOrder", userOrderSchema);
