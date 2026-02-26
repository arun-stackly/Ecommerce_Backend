const express = require("express");
const router = express.Router();

const {
  addBankDetails,
  updateBankDetails,
  getBankDetails,
} = require("../controllers/sellerBankController");

const { protect } = require("../middleware/authMiddleware");

// POST  -> Add bank details
router.post("/", protect, addBankDetails);

// PUT   -> Update bank details
router.put("/", protect, updateBankDetails);

// GET   -> Get bank details
router.get("/", protect, getBankDetails);

module.exports = router;
