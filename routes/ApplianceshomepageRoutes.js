const express = require("express");

const router = express.Router();

const {
  getHomepageData,
} = require("../controllers/ApplianceHomepageController");

// ==========================
// HOMEPAGE DATA
// ==========================

router.get("/", getHomepageData);

module.exports = router;