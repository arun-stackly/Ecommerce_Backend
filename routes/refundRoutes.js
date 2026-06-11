const express = require("express");
const router = express.Router();

const c = require("../controllers/refundController");

const { protect } = require("../middleware/authMiddleware");
const { protectUser } = require("../middleware/userAuthMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

/* =====================================
   CUSTOMER ROUTES
===================================== */

router.get(
  "/options/:returnId",
  protectUser,
  c.getRefundOptions
);

router.post(
  "/select-mode",
  protectUser,
  c.selectRefundMode
);

router.post(
  "/create",
  protectUser,
  c.createRefund
);

router.get(
  "/details/:returnId",
  protectUser,
  c.getRefundDetails
);

/* =====================================
   SELLER ROUTES
===================================== */

router.get(
  "/summary",
  protect,
  sellerOnly,
  c.refundSummary
);

router.get(
  "/",
  protect,
  sellerOnly,
  c.getRefunds
);

router.get(
  "/:id/process",
  protect,
  sellerOnly,
  c.getRefundProcessingData
);

router.put(
  "/:id/process",
  protect,
  sellerOnly,
  c.processRefund
);

module.exports = router;