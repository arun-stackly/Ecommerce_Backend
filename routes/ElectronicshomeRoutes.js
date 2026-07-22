const express = require("express");

const router = express.Router();

const {
  getHomePage,
} = require("../controllers/ElectronicshomepageController");


// ======================================================
// CATEGORY HOME PAGE
// GET /api/home/:categoryId
// ======================================================

router.get(
  "/:categoryId",
  getHomePage
);

module.exports = router;