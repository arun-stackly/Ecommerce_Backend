const express = require("express");
const multer = require("multer");

const {
  uploadImage,
  generateGetUrl,
} = require("../controllers/s3Controller");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/upload",
  upload.single("image"),
  uploadImage
);

router.get(
  "/get-url",
  generateGetUrl
);

module.exports = router;