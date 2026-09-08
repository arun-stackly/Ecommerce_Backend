const express = require("express");

const {
  adminLogin,refreshAccessToken,adminLogout
} = require("../controllers/adminAuthController");



const router = express.Router();

// Admin login
router.post("/login", adminLogin);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", adminLogout);

module.exports = router;