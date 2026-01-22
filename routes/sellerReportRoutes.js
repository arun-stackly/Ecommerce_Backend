const express = require("express");
const router = express.Router();

const { salesReport } = require("../controllers/sellerReportController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(sellerOnly);

router.get("/reports/sales", salesReport);

module.exports = router;
