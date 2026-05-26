const express = require("express");
const {
  sendOtp,
  verifyOtp,
  resetPassword,
} = require("../controllers/passwordController");
const router = express.Router();

router.post("/forgot", sendOtp);
router.post("/verify", verifyOtp);
router.post("/reset", resetPassword);

module.exports = router;
