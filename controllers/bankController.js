const BankDetails = require("../models/BankDetails");

const addBankDetails = async (req, res) => {
  try {
    const exists = await BankDetails.findOne({ seller: req.user._id });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Bank details already submitted",
      });
    }

    const { country } = req.body;

    // Country-based validation
    if (country === "India" && !req.body.ifscCode) {
      return res.status(400).json({
        success: false,
        message: "IFSC code is required for India",
      });
    }

    if (country === "USA" && !req.body.routingNumber) {
      return res.status(400).json({
        success: false,
        message: "Routing number is required for USA",
      });
    }

    if (country === "Others" && !req.body.iban) {
      return res.status(400).json({
        success: false,
        message: "IBAN is required for other countries",
      });
    }

    const bank = await BankDetails.create({
      seller: req.user._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Bank & payment details saved successfully",
      data: bank,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { addBankDetails };
