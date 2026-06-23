const mongoose = require("mongoose");
 
const userBankSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: false,
    },
 
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
 
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
 
    country: {
      type: String,
      default: "India",
    },
 
    accountNumber: {
      type: String,
      required: true,
    },
 
    ifscCode: {
      type: String,
      required: true,
      uppercase: true,
    },
 
    state: {
      type: String,
      required: true,
      trim: true,
    },
 
    upiId: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);
 
module.exports = mongoose.model("UserBank", userBankSchema);
 
 