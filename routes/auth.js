const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

// 🧑‍💼 SELLER AUTH
router.post("/signup", registerUser);
router.post("/login", loginUser);

// 🔐 SELLER PROFILE
router.get("/profile", protect, sellerOnly, getProfile);

module.exports = router;
