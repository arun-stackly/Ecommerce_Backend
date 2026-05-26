const express = require("express");
const router = express.Router();

const {
  overview,
  productViews,
  refundSummary,
} = require("../controllers/dashboardController");

const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(sellerOnly);

router.get("/overview", overview);
router.get("/product-views", productViews);
router.get("/refund-summary", refundSummary);

module.exports = router;
