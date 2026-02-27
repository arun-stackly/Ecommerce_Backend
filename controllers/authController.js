const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile"); // ✅ Added
const generateToken = require("../utils/generateToken");

/* ================= SELLER REGISTER ================= */
const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, username, email, password, confirmPassword } =
    req.body;

  if (!firstName || !lastName || !username || !email || !password) {
    res.status(400);
    throw new Error("All required fields must be filled");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const exists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (exists) {
    res.status(400);
    throw new Error("Seller already exists with this email or username");
  }

  // 🔒 CREATE SELLER USER
  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    role: "seller",
    isVerified: false,
  });

  // ✅ AUTO CREATE SELLER PROFILE
  await SellerProfile.create({
    user: user._id,
  });

  res.status(201).json({
    success: true,
    message: "Seller registered successfully. Awaiting admin approval.",
    data: {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      verified: user.isVerified,
      token: generateToken({ id: user._id, role: user.role }),
    },
  });
});

/* ================= SELLER LOGIN ================= */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user || user.role !== "seller") {
    res.status(401);
    throw new Error("Seller account not found");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.status(200).json({
    success: true,
    message: "Seller logged in successfully",
    data: {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      verified: user.isVerified,
      token: generateToken({ id: user._id, role: user.role }),
    },
  });
});

/* ================= GET SELLER PROFILE ================= */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user || user.role !== "seller") {
    res.status(404);
    throw new Error("Seller not found");
  }

  const profile = await SellerProfile.findOne({ user: user._id });

  res.status(200).json({
    success: true,
    data: {
      _id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      email: user.email,
      role: user.role,
      verified: user.isVerified,
      joinedDate: user.createdAt,

      phone: profile?.phone || null,
      address: profile?.address || null,
      registeredContact: profile?.registeredContact || null,
      profileImage: profile?.profileImage || null,
    },
  });
});

/* ================= SELLER LOGOUT ================= */
const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Seller logged out successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
};
