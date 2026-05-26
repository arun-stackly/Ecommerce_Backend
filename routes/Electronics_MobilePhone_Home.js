const express = require("express");

const router = express.Router();

const electronicsController =
  require("../controllers/Electronics _Mobilephone_homepage");

// CATEGORY LANDING PAGE
router.get(
  "/home/:productItemId",
  electronicsController.getProductLandingPage
);

module.exports = router;