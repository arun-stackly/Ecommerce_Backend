const express = require("express");

const router = express.Router();

const upload = require("../middleware/kycUpload");

const { uploadKyc, getKyc } = require("../controllers/kycController");

const { protect } = require("../middleware/authMiddleware");

const { sellerOnly } = require("../middleware/roleMiddleware");

// POST /api/seller/kyc/upload

router.post(
  "/upload",
  protect,
  sellerOnly,
  upload.fields([
    { name: "idProof", maxCount: 1 },
    { name: "businessProof", maxCount: 1 },
    { name: "additionalDocument", maxCount: 1 },
  ]),
  uploadKyc
);
// ================= GET KYC =================

// GET /api/seller/kyc

router.get(
  "/",
  protect,
  sellerOnly,
  getKyc
);
module.exports = router;