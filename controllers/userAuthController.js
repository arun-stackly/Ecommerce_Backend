const asyncHandler = require("express-async-handler");
const User = require("../models/UserAuth");
const generateToken = require("../utils/generateToken");

// 🔢 generate OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/* ================= SIGNUP / LOGIN : REQUEST OTP ================= */
exports.requestOTP = asyncHandler(async (req, res) => {
  const { phone, email, identifier } = req.body;

  const value = phone || email || identifier;
  if (!value) {
    res.status(400);
    throw new Error("Phone or Email is required");
  }

  let user = await User.findOne({
    $or: [{ phone: value }, { email: value }],
  });

  // ⚠️ creates user if not exists (used for signup)
  if (!user) {
    user = await User.create({
      phone: phone || null,
      email: email || null,
    });
  }

  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 mins
  await user.save();

  console.log("OTP:", otp); // replace with SMS / Email later

  res.json({
    success: true,
    message: "OTP sent successfully",
  });
});

/* ================= SIGNUP VERIFY OTP ================= */
exports.verifyOTP = asyncHandler(async (req, res) => {
  const { phone, email, identifier, otp } = req.body;
  const value = phone || email || identifier;

  const user = await User.findOne({
    $or: [{ phone: value }, { email: value }],
  });

  if (!user || user.otp !== otp || user.otpExpiry < Date.now()) {
    res.status(400);
    throw new Error("Wrong OTP or expired OTP");
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpiry = null;
  await user.save();

  res.json({
    success: true,
    message: "OTP verified",
    token: generateToken({ id: user._id }),
  });
});

/* ================= COMPLETE PROFILE (SIGNUP) ================= */
exports.completeProfile = asyncHandler(async (req, res) => {
  const { phone, firstName, lastName, email } = req.body;

  const user = await User.findOne({ phone });

  if (!user || !user.isVerified) {
    res.status(400);
    throw new Error("OTP verification required");
  }

  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;

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
    $or: [{ phone: value }, { email: value }],
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

/* ================= LOGIN VERIFY OTP ================= */
exports.loginVerifyOTP = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;

  const user = await User.findOne({
    $or: [{ phone: identifier }, { email: identifier }],
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user.otp !== otp || user.otpExpiry < Date.now()) {
    res.status(400);
    throw new Error("Wrong OTP or expired OTP");
  }

  user.otp = null;
  user.otpExpiry = null;
  user.isVerified = true;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      _id: user._id,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      phone: user.phone,
      email: user.email,
      token: generateToken({ id: user._id }),
    },
  });
});
