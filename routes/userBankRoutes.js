const express = require("express");
const router = express.Router();
 
const { protectUser } = require("../middleware/userAuthMiddleware");
 
const {
  saveUserBank,
  getUserBank,
} = require("../controllers/userBankController");
 
// Protect all routes
router.use(protectUser);
 
// Add or Update Bank Details
router.post("/", saveUserBank);
 
// Get Logged-in User Bank Details
router.get("/", getUserBank);
 
module.exports = router;
 