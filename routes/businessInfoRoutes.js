const express = require("express");
const router = express.Router();

const {
  createBusinessInfo,
  getBusinessInfo,
  updateBusinessInfo,
  deleteBusinessInfo,
} = require("../controllers/businessInfoController");

const { protect } = require("../middleware/authMiddleware");

// 🔐 Protect all routes
router.use(protect);

// ➕ CREATE business info
router.post("/", createBusinessInfo);

// 📄 READ business info
router.get("/", getBusinessInfo);

// ✏️ UPDATE business info
router.put("/", updateBusinessInfo);

// 🗑️ DELETE business info
router.delete("/", deleteBusinessInfo);

module.exports = router;
