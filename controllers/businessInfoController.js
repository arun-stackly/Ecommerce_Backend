const asyncHandler = require("express-async-handler");
const axios = require("axios");
const BusinessInfo = require("../models/BusinessInfo");
const Pincode = require("../models/Pincode");

/* ================= ADD BUSINESS INFO ================= */
exports.addBusinessInfo = asyncHandler(async (req, res) => {
  const alreadyExists = await BusinessInfo.findOne({
    seller: req.user._id,
  });

  if (alreadyExists) {
    return res.status(400).json({
      success: false,
      message: "Business information already added",
    });
  }

  let { postalCode } = req.body;
  let city, state;

  /* ===== POSTAL CODE VALIDATION ===== */
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

  /* ===== PINCODE CACHE CHECK ===== */
  let record = await Pincode.findOne({ pincode: postalCode });

  if (record) {
    city = record.city;
    state = record.state;
  } else {
    /* ===== INDIA POST API ===== */
    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${postalCode}`
    );

    const data = response.data?.[0];

    if (!data || data.Status !== "Success") {
      return res.status(404).json({
        success: false,
        message: "Invalid postal code",
      });
    }

    const postOffice = data.PostOffice[0];

    city = postOffice.District;
    state = postOffice.State;

    /* ===== SAVE PINCODE CACHE ===== */
    await Pincode.create({
      pincode: postalCode,
      city,
      state,
    });
  }

  /* ===== SAVE BUSINESS INFO ===== */
  const businessInfo = await BusinessInfo.create({
    seller: req.user._id,
    ...req.body,
    postalCode,
    city,
    state,
  });

  res.status(201).json({
    success: true,
    message: "Business information saved successfully",
    data: businessInfo,
  });
});

/* ================= GET BUSINESS INFO ================= */
exports.getBusinessInfo = asyncHandler(async (req, res) => {
  if (req.user.role !== "seller") {
    res.status(403);
    throw new Error("Access denied. Seller only.");
  }

  const businessInfo = await BusinessInfo.findOne({
    seller: req.user._id,
  });

  if (!businessInfo) {
    return res.status(404).json({
      success: false,
      message: "Business information not added yet",
    });
  }

  res.status(200).json({
    success: true,
    data: businessInfo,
  });
});
