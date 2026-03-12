const mongoose = require("mongoose");

const adSchema = new mongoose.Schema(
{
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  image: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ""
  },

  status: {
      type: Boolean,
      default: true,
    },

},
{ timestamps: true }
);

module.exports = mongoose.model("Ad", adSchema);