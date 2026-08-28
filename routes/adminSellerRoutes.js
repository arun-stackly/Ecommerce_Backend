const express = require("express");
const router = express.Router();

const {
  getSellerManagement,
  approveSeller,
  rejectSeller,
   getSellerById,
} = require("../controllers/adminSellerController");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

router.get(
  "/",
  adminAuthMiddleware,
  getSellerManagement
);

router.patch(
  "/:sellerId/approve",
  adminAuthMiddleware,
  approveSeller
);

router.patch(
  "/:sellerId/reject",
  adminAuthMiddleware,
  rejectSeller
);
router.get(
  "/:sellerId", adminAuthMiddleware,
  getSellerById
);

module.exports = router;