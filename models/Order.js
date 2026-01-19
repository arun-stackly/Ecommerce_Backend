
const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  totalAmount: Number,
  status: { type: String, enum: ["pending","completed","cancelled"], default:"pending" }
},{timestamps:true});
module.exports = mongoose.model("Order", orderSchema);
