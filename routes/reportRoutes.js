const express = require("express");
const router = express.Router();

const {
  salesReport,
  salesByRange,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(sellerOnly);

router.get("/sales", salesReport);

router.get("/sales-range", salesByRange);

module.exports = router;
