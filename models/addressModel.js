const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAuth",
      required: true,
    },

    fullName: String,
    phoneNumber: String,
    alternatePhone: String,

    houseNo: String,
    addressLine: String,
    city: String,
    pincode: String,
    district: String,
    state: String,
    landmark: String,

    addressType: {
      type: String,
      enum: ["Home", "Office", "Others"],
      default: "Home",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Address", addressSchema);
