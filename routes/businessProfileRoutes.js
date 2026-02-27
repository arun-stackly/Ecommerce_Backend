const express = require("express");
const router = express.Router();
const {
  createOrUpdateProfile,
  getProfile,
} = require("../controllers/businessProfileController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createOrUpdateProfile);
router.get("/", protect, getProfile);

module.exports = router;
