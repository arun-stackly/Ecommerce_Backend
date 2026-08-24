const express = require("express");

const router = express.Router();

const {
  getAdminSettings,
  updateAdminSettings,
} = require("../controllers/adminSettingsController");

const adminAuth = require("../middleware/adminAuthMiddleware");

// GET settings
router.get(
  "/",
  adminAuth,
  getAdminSettings
);

// UPDATE settings
router.put(
  "/",
  adminAuth,
  updateAdminSettings
);

module.exports = router;
