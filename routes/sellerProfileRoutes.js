const express = require("express");

const router = express.Router();

const {
  getSellerProfile,
  updateSellerProfile,
} = require("../controllers/sellerProfileController");

const { protect } = require("../middleware/authMiddleware");

const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
});

router.get("/", protect, getSellerProfile);

router.put(
  "/",
  protect,
  upload.single("profileImage"),
  updateSellerProfile
);

module.exports = router;