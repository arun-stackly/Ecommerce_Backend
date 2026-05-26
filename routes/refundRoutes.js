const express = require("express");
const router = express.Router();

const c = require("../controllers/refundController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(sellerOnly);

router.post("/", c.createRefund);
router.get("/", c.getRefunds);
router.get("/summary", c.refundSummary);

/* ALWAYS KEEP BELOW */
router.get("/:id/process", c.getRefundProcessingData);
router.put("/:id/process", c.processRefund);

module.exports = router;
