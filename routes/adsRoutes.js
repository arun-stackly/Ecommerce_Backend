const express = require("express");
const router = express.Router();
const adController = require("../controllers/adsController");
const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");

/* Seller Dashboard */
router.put("/bulk", protect, adController.saveAds);
router.post("/", protect, upload.single("media"), adController.createAd);
router.get("/my-ads", protect, adController.getMyAds);

/* Public Landing Page */
router.get("/", adController.getAds);

/* Update & Delete */
router.put("/:id", protect, upload.single("media"), adController.updateAd);
router.delete("/:id", protect, adController.deleteAd);

module.exports = router;