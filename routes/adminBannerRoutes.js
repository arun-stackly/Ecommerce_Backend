const express = require("express");

const router = express.Router();

const {
  getAdminBannerStats,
} = require("../controllers/adminbannerController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
router.get("/stats",adminAuthMiddleware, getAdminBannerStats);

module.exports = router;
