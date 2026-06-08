const express = require("express");
 
const {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
  getTermsAndConditions, // ✅ Added
} = require("../controllers/authController");
 
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");
 
const router = express.Router();
 
// 🧑‍💼 SELLER AUTH
router.get("/terms-and-conditions", getTermsAndConditions); // ✅ New API
 
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, sellerOnly, logoutUser);
 
// 🔐 SELLER PROFILE
router.get("/profile", protect, sellerOnly, getProfile);
 
module.exports = router;
 
 