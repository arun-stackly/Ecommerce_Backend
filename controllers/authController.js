const asyncHandler = require("express-async-handler");
const User = require("../models/User");
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

  // 🔒 FORCE SELLER
  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    role: "seller",
    joinAsSeller: true,
    isVerified: false,
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

  // 🚫 BLOCK NON-SELLERS
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

/* ================= PROFILE ================= */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user || user.role !== "seller") {
    res.status(404);
    throw new Error("Seller not found");
  }

  res.json({
    success: true,
    data: user,
  });
});

module.exports = {
  registerUser,
  loginUser,
  getProfile,
};
