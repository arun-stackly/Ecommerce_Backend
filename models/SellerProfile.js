const mongoose = require("mongoose");

const sellerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: "Phone must be 10 digits",
    },
  },

  address: {
    type: String,
  },

  registeredContact: {
    type: String,
    validate: {
      validator: function (v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: "Registered contact must be 10 digits",
    },
  },

  profileImage: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("SellerProfile", sellerProfileSchema);
