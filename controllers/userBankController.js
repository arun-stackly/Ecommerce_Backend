const UserBank = require("../models/UserBank");
 
// Add / Update Bank Details
exports.saveUserBank = async (req, res) => {
  try {
    const data = {
      ...req.body,
      user: req.user._id,
    };
 
    const bank = await UserBank.findOneAndUpdate({ user: req.user._id }, data, {
      new: true,
      upsert: true,
    });
 
    res.status(200).json({
      success: true,
      data: bank,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
 
// Get Bank Details
exports.getUserBank = async (req, res) => {
  try {
    const bank = await UserBank.findOne({
      user: req.user._id,
    });
 
    res.status(200).json({
      success: true,
      data: bank,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
 
 