const express = require("express");
const router = express.Router();

const { salesReport } = require("../controllers/sellerReportController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

// middleware
router.use(protect);
router.use(sellerOnly);

// GET /api/seller/reports/sales
router.get("/sales", salesReport);

module.exports = router;
