const mongoose = require("mongoose");

const pincodeSchema = new mongoose.Schema({
  pincode: { type: String, unique: true, index: true },
  district: String,
  city: String,
  state: String,
});

module.exports = mongoose.model("Pincode", pincodeSchema);
