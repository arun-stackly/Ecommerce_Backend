const mongoose = require("mongoose");

const contactInfoSchema =
  new mongoose.Schema(
    {
      email: {
        type: String,
        default: "",
      },

      whatsapp: {
        type: String,
        default: "",
      },

      website: {
        type: String,
        default: "",
      },

      facebook: {
        type: String,
        default: "",
      },

      twitter: {
        type: String,
        default: "",
      },

      instagram: {
        type: String,
        default: "",
      },
    },
    { timestamps: true }
  );

module.exports = mongoose.model(
  "ContactInfo",
  contactInfoSchema
);