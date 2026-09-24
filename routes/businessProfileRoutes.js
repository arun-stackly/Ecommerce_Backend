const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  createOrUpdateProfile,
  getProfile,
  deleteProfile,
} = require("../controllers/businessProfileController");

const { protect } = require("../middleware/authMiddleware");

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
});

// Create / Update Business Profile
router.post(
  "/",
  protect,
  upload.single("profileImage"),
  createOrUpdateProfile
);

// Get Business Profile
router.get(
  "/",
  protect,
  getProfile
);
// Delete Business Profile
router.delete(
  "/",
  protect,
  deleteProfile
);

module.exports = router;