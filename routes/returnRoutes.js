const express = require("express");
const router = express.Router();

const returnController = require("../controllers/returnController");
const {protect} = require("../middleware/authMiddleware")
const {protectUser} = require("../middleware/userAuthMiddleware")
const upload = require("../middleware/upload");
/* =========================
   CREATE RETURN REQUEST
========================= */
router.get(
  "/reasons",
  returnController.getReturnReasons
);

router.post(
  "/request",protectUser,upload.array("images", 5),
  returnController.createReturnRequest
);

/* =========================
   GET MY RETURNS
========================= */
router.get(
  "/my",protectUser,
  returnController.getMyReturns
);

/* =========================
   GET SELLER RETURNS
========================= */
router.get(
  "/seller",protect,
  returnController.getSellerReturns
);

/* =========================
   GET SINGLE RETURN
========================= */
router.get(
  "/:id",protectUser,
  returnController.getSingleReturn
);

/* =========================
   UPDATE STATUS (ADMIN/SELLER)
========================= */
router.put(
  "/:id/status",protect,
  returnController.updateReturnStatus
);
/* =========================
   UPDATE REASON
========================= */
router.put(
  "/:id",protectUser,
  returnController.updateReturnReason)

router.get(
  "/tracking/:id",
  protectUser,
  returnController.getReturnTracking
);

module.exports = router;