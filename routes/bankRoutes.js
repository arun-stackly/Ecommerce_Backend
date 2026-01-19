const express = require("express");
const router = express.Router();

const {
  createBankDetails,
  getBankDetails,
  updateBankDetails,
  deleteBankDetails,
} = require("../controllers/bankController");

const { protectAsync } = require("../middleware/authMiddleware");

// 🔐 Protect all bank routes
router.use(protectAsync);

// ➕ CREATE bank details
router.post("/", createBankDetails);

// 📄 READ bank details
router.get("/", getBankDetails);

// ✏️ UPDATE bank details
router.put("/", updateBankDetails);

// 🗑️ DELETE bank details
router.delete("/", deleteBankDetails);

module.exports = router;
