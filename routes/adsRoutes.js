const express = require("express");
const router = express.Router();
const adController = require("../controllers/adsController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, adController.createAd);

router.post("/bulk", protect, adController.createMultipleAds);

router.get("/my-ads", protect, adController.getSellerAds);

router.patch("/:id/pause", protect, adController.pauseAd);

router.patch("/:id/resume", protect, adController.resumeAd);

router.delete("/:id", protect, adController.deleteAd);

router.get("/active", adController.getActiveAds);

module.exports = router;