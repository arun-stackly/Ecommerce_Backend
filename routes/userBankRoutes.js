const express = require("express");
const router = express.Router();
 
const { protectUser } = require("../middleware/userAuthMiddleware");
 
const { saveUserBank } = require("../controllers/userBankController");
 
router.use(protectUser);
 
// Add Bank Details
router.post("/", saveUserBank);
module.exports = router;
 