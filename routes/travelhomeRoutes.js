const express = require("express");
const router = express.Router();

const travelController = require("../controllers/TravelHomepageController");

// Home Page API
router.get("/home/:categoryId", travelController.getHomePage);

module.exports = router;