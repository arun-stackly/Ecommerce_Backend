const express = require("express");
const router = express.Router();
const {
  getSellerSettings,
  updateSellerDetails,
  changePassword,
  updateNotifications,
} = require("../controllers/sellerSettingsController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getSellerSettings);
router.put("/update", protect, updateSellerDetails);
router.put("/change-password", protect, changePassword);
router.put("/notifications", protect, updateNotifications);

module.exports = router;
