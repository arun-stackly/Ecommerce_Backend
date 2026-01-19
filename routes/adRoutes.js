const express = require("express");
const router = express.Router();

const c = require("../controllers/adController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(sellerOnly);

router.post("/", c.createAd);
router.get("/", c.getAds);

module.exports = router;
