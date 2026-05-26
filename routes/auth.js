const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  logoutUser, // ✅ import logout
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

// 🧑‍💼 SELLER AUTH
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, sellerOnly, logoutUser); // ✅ added

// 🔐 SELLER PROFILE
router.get("/profile", protect, sellerOnly, getProfile);

module.exports = router;
