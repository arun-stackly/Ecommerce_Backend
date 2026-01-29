const express = require("express");
const router = express.Router();

const {
  createBankDetails,
  getBankDetails,
  updateBankDetails,
  deleteBankDetails,
} = require("../controllers/bankController");

const { protect } = require("../middleware/authMiddleware");


// 🔐 Protect all bank routes
router.use(protect);

router.post("/", createBankDetails);
router.get("/", getBankDetails);
router.put("/", updateBankDetails);
router.delete("/", deleteBankDetails);

module.exports = router;
