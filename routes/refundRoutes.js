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
  "/user/options/:returnId",
  protectUser,
  c.getRefundOptions
);

router.post(
  "/user/select-mode",
  protectUser,
  c.selectRefundMode
);



router.get(
  "/user/details/:returnId",
  protectUser,
  c.getRefundDetails
);

/* =====================================
   SELLER ROUTES
===================================== */
router.post(
  "/seller/create",
  protect, 
  sellerOnly,
  c.createRefund
);

router.get(
  "/seller/summary",
  protect,
  sellerOnly,
  c.refundSummary
);

router.get(
  "/seller/",
  protect,
  sellerOnly,
  c.getRefunds
);

router.get(
  "/seller/:id/process",
  protect,
  sellerOnly,
  c.getRefundProcessingData
);

router.put(
  "/seller/:id/process",
  protect,
  sellerOnly,
  c.processRefund
);

module.exports = router;