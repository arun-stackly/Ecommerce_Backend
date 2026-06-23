const asyncHandler = require("express-async-handler");
const User = require("../models/UserAuth");
const UserBank = require("../models/UserBank");
const UserCard = require("../models/UserCard");
const Address = require("../models/addressModel")
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
    userId: user._id, // ✅ USER ID
    token: generateToken({ id: user._id }),
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    email: user.email,
    phone: user.phone,
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
      userId: user._id, // ✅ USER ID
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
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
 


exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "firstName lastName email phone"
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const [address, bankAccounts, cards] =
    await Promise.all([
      Address.find({ userId: req.user._id }),
      UserBank.find({ user: req.user._id }),
      UserCard.find({ user: req.user._id }),
    ]);

  res.json({
    success: true,
    data: {
      userId: user._id,
      name: `${user.firstName || ""} ${
        user.lastName || ""
      }`.trim(),
      email: user.email,
      phone: user.phone,

      address,
      bankAccounts,
      cards,
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
      userId: user._id, // ✅ USER ID
      name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      phone: user.phone,
    },
  });
});
 
/* ================= LOGOUT ================= */
exports.logoutUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});
 
/* ================= DELETE PROFILE ================= */
exports.deleteProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await User.findByIdAndDelete(req.user._id);

  res.json({
    success: true,
    message: "Profile deleted successfully",
  });
});
/* ================= GET BANK DETAILS ================= */
exports.getBankDetails = asyncHandler(async (req, res) => {
  const bank = await UserBank.findOne({
    user: req.user._id,
  }).select("-upiId"); // Exclude upiId
 
  if (!bank) {
    return res.status(200).json({
      success: true,
      data: null,
    });
  }
 
  res.json({
    success: true,
    data: bank,
  });
});
 
/* ================= UPDATE BANK DETAILS ================= */
exports.updateBankDetails = asyncHandler(async (req, res) => {
  const {
    accountHolderName,
    bankName,
    country,
    accountNumber,
    ifscCode,
    state,
  } = req.body;
 
  let bank = await UserBank.findOne({
    user: req.user._id,
  });
 
  if (!bank) {
    bank = await UserBank.create({
      user: req.user._id,
      accountHolderName,
      bankName,
      country: country || "India",
      accountNumber,
      ifscCode,
      state,
    });
  } else {
    if (accountHolderName)
      bank.accountHolderName = accountHolderName;
 
    if (bankName)
      bank.bankName = bankName;
 
    if (country)
      bank.country = country;
 
    if (accountNumber)
      bank.accountNumber = accountNumber;
 
    if (ifscCode)
      bank.ifscCode = ifscCode;
 
    if (state)
      bank.state = state;
 
    await bank.save();
  }
 
  // Exclude upiId from response
  const responseData = bank.toObject();
  delete responseData.upiId;
 
  res.json({
    success: true,
    message: "Bank details updated successfully",
    data: responseData,
  });
});
 
 
/* ================= ADD UPI DETAILS ================= */
exports.addUpiDetails = asyncHandler(async (req, res) => {
  const { upiId } = req.body;
 
  if (!upiId) {
    res.status(400);
    throw new Error("UPI ID is required");
  }
 
  const exists = await UserBank.findOne({
    user: req.user._id,
  });
 
  if (exists && exists.upiId) {
    res.status(400);
    throw new Error("UPI details already exist");
  }
 
  let bank;
 
  if (!exists) {
    bank = await UserBank.create({
      user: req.user._id,
      upiId,
    });
  } else {
    exists.upiId = upiId;
 
    bank = await exists.save();
  }
 
  res.status(201).json({
    success: true,
    message: "UPI details added successfully",
    data: {
      upiId: bank.upiId,
    },
  });
});
/* ================= GET UPI DETAILS ================= */
exports.getUpiDetails = asyncHandler(async (req, res) => {
  const bank = await UserBank.findOne({
    user: req.user._id,
  }).select("upiId");
 
  res.json({
    success: true,
    data: {
      upiId: bank?.upiId || "",
    },
  });
});
/* ================= UPDATE UPI DETAILS ================= */
exports.updateUpiDetails = asyncHandler(async (req, res) => {
  const { upiId } = req.body;
 
  let bank = await UserBank.findOne({
    user: req.user._id,
  });
 
  if (!bank) {
    bank = await UserBank.create({
      user: req.user._id,
      upiId,
    });
  } else {
    bank.upiId = upiId;
    await bank.save();
  }
 
  res.json({
    success: true,
    message: "UPI details updated successfully",
    data: {
      upiId: bank.upiId,
    },
  });
});
exports.addCardDetails = asyncHandler(async (req, res) => {
  const { cardNumber, cardHolderName, expiryDate, cvv } = req.body;
 
  const card = await UserCard.create({
    user: req.user._id,
    cardNumber,
    cardHolderName,
    expiryDate,
    cvv,
  });
 
  res.status(201).json({
    success: true,
    message: "Card added successfully",
    data: card,
  });
});
exports.getCardDetails = asyncHandler(async (req, res) => {
  const cards = await UserCard.find({
    user: req.user._id,
  });
 
  res.json({
    success: true,
    count: cards.length,
    data: cards,
  });
});
exports.updateCardDetails = asyncHandler(async (req, res) => {
  const card = await UserCard.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
 
  if (!card) {
    res.status(404);
    throw new Error("Card not found");
  }
 
  const { cardNumber, cardHolderName, expiryDate, cvv } = req.body;
 
  if (cardNumber) card.cardNumber = cardNumber;
 
  if (cardHolderName) card.cardHolderName = cardHolderName;
 
  if (expiryDate) card.expiryDate = expiryDate;
 
  if (cvv) card.cvv = cvv;
 
  await card.save();
 
  res.json({
    success: true,
    message: "Card updated successfully",
    data: card,
  });
});
exports.deleteCardDetails = asyncHandler(async (req, res) => {
  const card = await UserCard.findOne({
    _id: req.params.id,
    user: req.user._id,
  });
 
  if (!card) {
    res.status(404);
    throw new Error("Card not found");
  }
 
  await card.deleteOne();
 
  res.json({
    success: true,
    message: "Card deleted successfully",
  });
});
 
 