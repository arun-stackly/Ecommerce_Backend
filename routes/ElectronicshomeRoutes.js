const express = require("express");

const router = express.Router();

const {
  getHomePageData,
} = require("../controllers/ElectronicshomepageController");


// ======================================================
// CATEGORY HOME PAGE
// GET /api/home/:categoryId
// ======================================================

router.get(
  "/home/:categoryId",
  getHomePageData
);

module.exports = router;