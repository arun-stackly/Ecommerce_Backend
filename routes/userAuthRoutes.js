const express = require("express");
const {
  requestOTP,
  verifyOTP,
  completeProfile,
  resendOTP,
  getProfile,
  updateProfile,
} = require("../controllers/userAuthController");

const { protectUser } = require("../middleware/userAuthMiddleware");

const router = express.Router();

/* ================= SIGNUP ================= */
router.post("/signup/request-otp", requestOTP);
router.post("/signup/verify-otp", verifyOTP);
router.post("/signup/complete", completeProfile);

/* ================= LOGIN ================= */
router.post("/login/request-otp", requestOTP);
router.post("/login/verify-otp", verifyOTP);

/* ================= OTP ================= */
router.post("/resend-otp", resendOTP);

/* ================= PROFILE ================= */
router.get("/profile", protectUser, getProfile);
router.put("/profile", protectUser, updateProfile);

module.exports = router;
