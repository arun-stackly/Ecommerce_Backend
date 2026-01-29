const express = require("express");
const {
  requestOTP,
  verifyOTP,
  completeProfile,
  resendOTP,
  loginVerifyOTP,
} = require("../controllers/userAuthController");

const router = express.Router();

router.post("/signup/request-otp", requestOTP);
router.post("/signup/verify-otp", verifyOTP);
router.post("/signup/complete", completeProfile);

router.post("/login/request-otp", requestOTP);
router.post("/login/verify-otp", loginVerifyOTP);

router.post("/resend-otp", resendOTP);

module.exports = router;
