const Pincode = require("../models/Pincode");

exports.getCityState = async (req, res) => {
  const { pincode } = req.body;

  if (!pincode || pincode.length !== 6) {
    return res.status(400).json({
      success: false,
      message: "Invalid pincode"
    });
  }

  const data = await Pincode.findOne({ pincode });

  if (!data) {
    return res.status(404).json({
      success: false,
      message: "Pincode not found"
    });
  }

  res.json({
    success: true,
    city: data.city,
    state: data.state
  });
};