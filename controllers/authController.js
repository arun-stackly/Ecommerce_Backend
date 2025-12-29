const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

/* ================= REGISTER ================= */
const registerUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    username,
    email,
    password,
    confirmPassword,
    joinAsSeller,
  } = req.body;

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
    throw new Error("User already exists with this email or username");
  }

  const role = joinAsSeller ? "seller" : "user";

  const user = await User.create({
    firstName,
    lastName,
    username,
    email,
    password,
    joinAsSeller,
    role,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      token: generateToken({ id: user._id, role: user.role }),
    },
  });
});

/* ================= LOGIN ================= */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    message:
      user.joinAsSeller === true
        ? "Seller account logged in successfully"
        : "User account logged in successfully",
    data: {
      _id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      token: generateToken({ id: user._id, role: user.role }),
    },
  });
});

/* ================= PROFILE ================= */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
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
