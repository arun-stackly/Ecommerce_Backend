const BankDetails = require("../models/BankDetails");

/* ================= CREATE BANK DETAILS ================= */
exports.createBankDetails = async (req, res) => {
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

/* ================= READ BANK DETAILS ================= */
exports.getBankDetails = async (req, res) => {
  try {
    const bank = await BankDetails.findOne({
      seller: req.user._id,
    });

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Bank details not found",
      });
    }

    res.status(200).json({
      success: true,
      data: bank,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE BANK DETAILS ================= */
exports.updateBankDetails = async (req, res) => {
  try {
    const bank = await BankDetails.findOne({
      seller: req.user._id,
    });

    if (!bank) {
      return res.status(404).json({
        success: false,
        message: "Bank details not found",
      });
    }

    const { country } = req.body;

    // Country-based validation (only if updating)
    if (country === "India" && req.body.ifscCode === undefined) {
      return res.status(400).json({
        success: false,
        message: "IFSC code is required for India",
      });
    }

    if (country === "USA" && req.body.routingNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: "Routing number is required for USA",
      });
    }

    if (country === "Others" && req.body.iban === undefined) {
      return res.status(400).json({
        success: false,
        message: "IBAN is required for other countries",
      });
    }

    const updatedBank = await BankDetails.findOneAndUpdate(
      { seller: req.user._id },
      req.body,
      { new: true, runValidators: true },
    );

    res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
      data: updatedBank,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE BANK DETAILS ================= */
exports.deleteBankDetails = async (req, res) => {
  try {
    const deleted = await BankDetails.findOneAndDelete({
      seller: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Bank details not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bank details deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
