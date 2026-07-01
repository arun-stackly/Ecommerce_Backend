const express = require("express");

const router = express.Router();

const {
  getHomePage,
} = require("../controllers/ApplianceHomepageController");

// ==========================
// HOMEPAGE DATA
// ==========================

router.get("/:categoryId", getHomePage);

module.exports = router;