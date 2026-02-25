const express = require("express");
const router = express.Router();

const bannerController = require("../controllers/bannerController");

// ADD API
router.post("/add", bannerController.addBanner);

// GET Monthly Banner
router.get("/monthly", bannerController.getMonthlyBanner);

// OPTIONAL (query based)
router.get("/", bannerController.getBanners);

module.exports = router;