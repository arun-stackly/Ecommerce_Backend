const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

/* ================= PROTECT SELLER ================= */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Authorization token missing");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    res.status(401);
    throw new Error("User not found");
  }

  // 🔒 SELLER ONLY
  if (user.role !== "seller") {
    res.status(403);
    throw new Error("Access denied. Seller only");
  }

  // ⛔ OPTIONAL: Block unverified sellers
  // if (!user.isVerified) {
  //   res.status(403);
  //   throw new Error("Seller not verified by admin");
  // }

  req.user = user;
  next();
});

module.exports = { protect };
