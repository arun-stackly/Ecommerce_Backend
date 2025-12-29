const BusinessInfo = require("../models/BusinessInfo");

exports.addBusinessInfo = async (req, res) => {
  try {
    const alreadyExists = await BusinessInfo.findOne({
      seller: req.user._id,
    });

    if (alreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Business information already added",
      });
    }

    const businessInfo = await BusinessInfo.create({
      seller: req.user._id,
      ...req.body,
    });

    res.status(201).json({
      success: true,
      message: "Business information saved",
      data: businessInfo,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
