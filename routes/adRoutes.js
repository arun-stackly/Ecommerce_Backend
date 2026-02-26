const express = require("express");
const router = express.Router();

const controller = require("../controllers/adController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

// Protect all routes
router.use(protect);
router.use(sellerOnly);

/* ================= CREATE OR UPDATE AD ================= */
router.post("/", controller.createOrUpdateAd);

/* ================= GET SELLER ADS ================= */
router.get("/", controller.getSellerAds);

/* ================= DELETE AD ================= */
router.delete("/:id", controller.deleteAd);

/* ================= UPDATE STATUS ================= */
router.put("/:id/status", controller.updateAdStatus);

module.exports = router;
