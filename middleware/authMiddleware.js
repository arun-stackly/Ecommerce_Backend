const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // ❌ Token missing
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, invalid or expired token");
  }
});

module.exports = { protect };
