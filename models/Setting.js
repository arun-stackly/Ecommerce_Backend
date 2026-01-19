
const mongoose = require("mongoose");
const settingSchema = new mongoose.Schema({
  userId:mongoose.Schema.Types.ObjectId,
  notifications:Boolean,
  darkMode:Boolean
});
module.exports = mongoose.model("Setting", settingSchema);
