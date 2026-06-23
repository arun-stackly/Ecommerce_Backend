const UserBank = require("../models/UserBank");
 
// Add Bank Details
exports.saveUserBank = async (req, res) => {
  try {
    // Check if bank details already exist
    const exists = await UserBank.findOne({
      user: req.user._id,
    });
 
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Bank details already exist. Please use update API.",
      });
    }
 
    const bank = await UserBank.create({
      ...req.body,
      user: req.user._id,
    });
 
    res.status(201).json({
      success: true,
      message: "Bank details added successfully",
      data: bank,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
 
 