const express = require("express");
const router = express.Router();

const {
  addBusinessInfo,
  getBusinessInfo,
} = require("../controllers/businessInfoController");

const { protect } = require("../middleware/authMiddleware");

// ✅ POST → Add business info
router.post("/", protect, addBusinessInfo);

// ✅ GET → Fetch logged-in seller business info
router.get("/", protect, getBusinessInfo);

module.exports = router;
