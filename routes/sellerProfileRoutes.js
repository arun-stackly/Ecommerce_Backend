const express = require("express");
const router = express.Router();

const {
  getSellerProfile,
  updateSellerProfile,
} = require("../controllers/sellerProfileController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getSellerProfile);
router.put("/", protect, updateSellerProfile);

module.exports = router;
