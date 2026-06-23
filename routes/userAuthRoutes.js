const express = require("express");
 
const {
  requestOTP,
  verifyOTP,
  completeProfile,
  resendOTP,
 
  // Profile
  getProfile,
  updateProfile,
  deleteProfile,
 
  // Bank Details
  getBankDetails,
  updateBankDetails,
 
  // UPI Details
  addUpiDetails,
  getUpiDetails,
  updateUpiDetails,
 
  // Card Details
  addCardDetails,
  getCardDetails,
  updateCardDetails,
  deleteCardDetails,
 
  // Logout
  logoutUser,
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
router.delete("/profile", protectUser, deleteProfile )
 
/* ================= BANK DETAILS ================= */
router.get("/bank-details", protectUser, getBankDetails);
router.put("/bank-details", protectUser, updateBankDetails);
 
/* ================= UPI DETAILS ================= */
router.post("/upi-details", protectUser, addUpiDetails);
router.get("/upi-details", protectUser, getUpiDetails);
router.put("/upi-details", protectUser, updateUpiDetails);
 
/* ================= CARD DETAILS ================= */
router.post("/card-details", protectUser, addCardDetails);
router.get("/card-details", protectUser, getCardDetails);
router.put("/card-details/:id", protectUser, updateCardDetails);
router.delete("/card-details/:id", protectUser, deleteCardDetails);
 
/* ================= LOGOUT ================= */
router.post("/logout", protectUser, logoutUser);
 
module.exports = router;
 
 