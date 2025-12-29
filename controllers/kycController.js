const Kyc = require("../models/Kyc");

const uploadKyc = async (req, res) => {
  try {
    const exists = await Kyc.findOne({ seller: req.user._id });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "KYC already submitted",
      });
    }

    if (!req.files || !req.files.idProof) {
      return res.status(400).json({
        success: false,
        message: "ID proof is required",
      });
    }

    if (!req.body.isConfirmed) {
      return res.status(400).json({
        success: false,
        message: "Please confirm document declaration",
      });
    }

    const kyc = await Kyc.create({
      seller: req.user._id,
      idProof: req.files.idProof[0].path,
      businessProof: req.files.businessProof?.[0]?.path,
      additionalDocument: req.files.additionalDocument?.[0]?.path,
      isIndividualSeller: req.body.isIndividualSeller || false,
      isConfirmed: req.body.isConfirmed,
    });

    res.status(201).json({
      success: true,
      message: "KYC documents uploaded successfully",
      data: kyc,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { uploadKyc };
