const asyncHandler = require("express-async-handler");
const axios = require("axios");
const BusinessInfo = require("../models/BusinessInfo");
const Pincode = require("../models/Pincode");

/* ================= CREATE BUSINESS INFO ================= */
exports.createBusinessInfo = asyncHandler(async (req, res) => {
  const exists = await BusinessInfo.findOne({ seller: req.user._id });
  if (exists) {
    return res.status(400).json({
      success: false,
      message: "Business information already exists",
    });
  }

  let { postalCode } = req.body;
  let city, state;

  if (!postalCode) {
    return res.status(400).json({
      success: false,
      message: "Postal code is required",
    });
  }

  postalCode = String(postalCode);

  if (!/^[1-9][0-9]{5}$/.test(postalCode)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Indian PIN code",
    });
  }

  const cached = await Pincode.findOne({ pincode: postalCode });

  if (cached) {
    city = cached.city;
    state = cached.state;
  } else {
    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${postalCode}`,
    );

    const data = response.data?.[0];
    if (!data || data.Status !== "Success") {
      return res.status(404).json({
        success: false,
        message: "Invalid postal code",
      });
    }

    city = data.PostOffice[0].District;
    state = data.PostOffice[0].State;

    await Pincode.create({ pincode: postalCode, city, state });
  }

  const businessInfo = await BusinessInfo.create({
    seller: req.user._id,
    ...req.body,
    postalCode,
    city,
    state,
    isCompleted: true,
  });

  res.status(201).json({
    success: true,
    message: "Business information created successfully",
    data: businessInfo,
  });
});

/* ================= READ BUSINESS INFO ================= */
exports.getBusinessInfo = asyncHandler(async (req, res) => {
  const businessInfo = await BusinessInfo.findOne({
    seller: req.user._id,
  });

  if (!businessInfo) {
    return res.status(404).json({
      success: false,
      message: "Business information not found",
    });
  }

  res.status(200).json({
    success: true,
    data: businessInfo,
  });
});

/* ================= UPDATE BUSINESS INFO ================= */
exports.updateBusinessInfo = asyncHandler(async (req, res) => {
  const businessInfo = await BusinessInfo.findOne({
    seller: req.user._id,
  });

  if (!businessInfo) {
    return res.status(404).json({
      success: false,
      message: "Business information not found",
    });
  }

  let updateData = { ...req.body };

  if (req.body.postalCode) {
    let postalCode = String(req.body.postalCode);

    if (!/^[1-9][0-9]{5}$/.test(postalCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Indian PIN code",
      });
    }

    let record = await Pincode.findOne({ pincode: postalCode });

    let city, state;

    if (record) {
      city = record.city;
      state = record.state;
    } else {
      const response = await axios.get(
        `https://api.postalpincode.in/pincode/${postalCode}`,
      );

      const data = response.data?.[0];
      if (!data || data.Status !== "Success") {
        return res.status(404).json({
          success: false,
          message: "Invalid postal code",
        });
      }

      city = data.PostOffice[0].District;
      state = data.PostOffice[0].State;

      await Pincode.create({ pincode: postalCode, city, state });
    }

    updateData.postalCode = postalCode;
    updateData.city = city;
    updateData.state = state;
  }

  const updatedBusinessInfo = await BusinessInfo.findOneAndUpdate(
    { seller: req.user._id },
    updateData,
    { new: true, runValidators: true },
  );

  res.status(200).json({
    success: true,
    message: "Business information updated successfully",
    data: updatedBusinessInfo,
  });
});

/* ================= DELETE BUSINESS INFO ================= */
exports.deleteBusinessInfo = asyncHandler(async (req, res) => {
  const deleted = await BusinessInfo.findOneAndDelete({
    seller: req.user._id,
  });

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Business information not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Business information deleted successfully",
  });
});
