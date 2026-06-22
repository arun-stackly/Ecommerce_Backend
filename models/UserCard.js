const mongoose = require("mongoose");
 
const userCardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
 
    cardNumber: {
      type: String,
      required: true,
    },
 
    cardHolderName: {
      type: String,
      required: true,
      trim: true,
    },
 
    expiryDate: {
      type: String,
      required: true, // MM/YY
    },
 
    cvv: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);
 
module.exports = mongoose.model("UserCard", userCardSchema);
 
 