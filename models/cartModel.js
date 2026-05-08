const mongoose = require("mongoose");
 
/* ================= CART ITEM ================= */
 
const cartItemSchema = new mongoose.Schema(

  {
     
    sellerInventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SellerInventory",
      required: true,
    },
   
    quantity: {

      type: Number,

      default: 1,

    },
 
    totalPrice: {

      type: Number,

      default: 0,

    },

  },

  { _id: true }

);
 
/* ================= SELLER GROUP ================= */
 
const sellerGroupSchema = new mongoose.Schema(

  {

    sellerId: {

      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

    },
 
    sellerName: {

      type: String,

      required: true,

    },
 
    items: [cartItemSchema],
 
    sellerTotal: {

      type: Number,

      default: 0,

    },

  },

  { _id: true }

);
 
/* ================= CART ================= */
 
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

      district: String,

      state: String,

      country: String,

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

      price: {

        type: Number,

        default: 0,

      },
 
      discount: {

        type: Number,

        default: 0,

      },
 
      couponDiscount: {

        type: Number,

        default: 0,

      },
 
      platformFee: {

        type: Number,

        default: 40,

      },
 
      totalAmount: {

        type: Number,

        default: 0,

      },

    },

  },

  { timestamps: true }

);
 
module.exports = mongoose.model("Cart", cartSchema);
 