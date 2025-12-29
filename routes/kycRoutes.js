const express = require("express");
const router = express.Router();

const upload = require("../middleware/kycUpload");
const { uploadKyc } = require("../controllers/kycController");
const { protectAsync } = require("../middleware/authMiddleware");

router.post(
  "/upload",
  protectAsync,
  upload.fields([
    { name: "idProof", maxCount: 1 },
    { name: "businessProof", maxCount: 1 },
    { name: "additionalDocument", maxCount: 1 },
  ]),
  uploadKyc
);

module.exports = router;
