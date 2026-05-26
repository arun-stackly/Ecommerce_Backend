const asyncHandler = require("express-async-handler");
const Otp = require("../models/Otp");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

/* ================= SEND OTP ================= */
const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("No user found with that email");
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await Otp.deleteMany({ email });

  await Otp.create({
    email,
    code,
    expiresAt,
    verified: false,
  });

  console.log("OTP (DEV MODE):", code);

  res.json({
    success: true,
    message: "OTP generated successfully",
  });
});

/* ================= VERIFY OTP ================= */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error("Email and OTP code are required");
  }

  const otp = await Otp.findOne({ email, code, verified: false });

  if (!otp) {
    res.status(400);
    throw new Error("Invalid OTP");
  }

  if (otp.expiresAt < Date.now()) {
    res.status(400);
    throw new Error("OTP expired");
  }

  otp.verified = true;
  await otp.save();

  res.json({
    success: true,
    message: "OTP verified successfully",
  });
});

/* ================= RESET PASSWORD ================= */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    res.status(400);
    throw new Error("Email, password and confirm password are required");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const otp = await Otp.findOne({ email, verified: true });
  if (!otp) {
    res.status(400);
    throw new Error("OTP not verified");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.password = password;
  await user.save();

  await Otp.deleteMany({ email });

  res.json({
    success: true,
    message: "Password reset successful",
  });
});

module.exports = {
  sendOtp,
  verifyOtp,
  resetPassword,
};
