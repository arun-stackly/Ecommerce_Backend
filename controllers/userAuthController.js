const asyncHandler = require("express-async-handler");
const User = require("../models/UserAuth");
const generateToken = require("../utils/generateToken");

/* ================= GENERATE OTP ================= */
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= REQUEST OTP ================= */
exports.requestOTP = asyncHandler(async (req, res) => {
  const { phone, email, identifier } = req.body;

  const value = phone || email || identifier;
  if (!value) {
    res.status(400);
    throw new Error("Phone or Email is required");
  }

  let user = await User.findOne({
    $or: [
      phone ? { phone } : null,
      email ? { email } : null,
      identifier ? { phone: identifier } : null,
      identifier ? { email: identifier } : null,
    ].filter(Boolean),
  });

  if (!user) {
    const data = {};
    if (phone) data.phone = phone;
    if (email) data.email = email;
    user = await User.create(data);
  }

  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;
  await user.save();

  console.log("OTP:", otp);

  res.json({
    success: true,
    message: "OTP sent successfully",
  });
});

/* ================= VERIFY OTP (LOGIN / SIGNUP) ================= */
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { phone, email, identifier, otp } = req.body;

  const user = await User.findOne({
    $or: [
      phone ? { phone } : null,
      email ? { email } : null,
      identifier ? { phone: identifier } : null,
      identifier ? { email: identifier } : null,
    ].filter(Boolean),
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    res.status(400);
    throw new Error("Wrong OTP or expired OTP");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  res.json({
    success: true,
    message: "Login successful",
    token: generateToken({ id: user._id }),
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
  });
});

/* ================= COMPLETE PROFILE ================= */
exports.completeProfile = asyncHandler(async (req, res) => {
  const { phone, firstName, lastName, email } = req.body;

  const user = await User.findOne({ phone });

  if (!user || !user.isVerified) {
    res.status(400);
    throw new Error("OTP verification required");
  }

  user.firstName = firstName;
  user.lastName = lastName;

  if (email) user.email = email;

  await user.save();

  res.json({
    success: true,
    message: "Signup completed",
    data: {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      token: generateToken({ id: user._id }),
    },
  });
});

/* ================= RESEND OTP ================= */
exports.resendOTP = asyncHandler(async (req, res) => {
  const { phone, email, identifier } = req.body;

  const value = phone || email || identifier;
  if (!value) {
    res.status(400);
    throw new Error("Phone or Email is required");
  }

  const user = await User.findOne({
    $or: [
      phone ? { phone } : null,
      email ? { email } : null,
      identifier ? { phone: identifier } : null,
      identifier ? { email: identifier } : null,
    ].filter(Boolean),
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000;

  await user.save();

  console.log("Resent OTP:", otp);

  res.json({
    success: true,
    message: "OTP resent successfully",
  });
});

/* ================= GET PROFILE ================= */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "firstName lastName email phone",
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({
    success: true,
    data: {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      phone: user.phone,
    },
  });
});

/* ================= UPDATE PROFILE ================= */
exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, phone } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email;
  if (phone) user.phone = phone;

  await user.save();

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: {
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      phone: user.phone,
    },
  });
});
