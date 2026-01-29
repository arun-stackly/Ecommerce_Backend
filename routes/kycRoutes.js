const express = require("express");
const router = express.Router();

const upload = require("../middleware/kycUpload");
const { uploadKyc } = require("../controllers/kycController");
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
  uploadKyc,
);

module.exports = router;
