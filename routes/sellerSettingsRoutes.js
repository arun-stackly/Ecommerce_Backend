const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getSellerSettings,
  updateSellerDetails,
  deleteSellerProfileImage,
  changePassword,
  updateNotifications,
} = require("../controllers/sellerSettingsController");

const { protect } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


/* GET SELLER SETTINGS */
router.get(
  "/",
  protect,
  getSellerSettings
);


/* UPDATE SELLER DETAILS + PROFILE IMAGE */
router.put(
  "/update",
  protect,
  upload.single("profileImage"),
  updateSellerDetails
);


/* DELETE PROFILE IMAGE */
router.delete(
  "/profile-image",
  protect,
  deleteSellerProfileImage
);


/* CHANGE PASSWORD */
router.put(
  "/change-password",
  protect,
  changePassword
);


/* UPDATE NOTIFICATIONS */
router.put(
  "/notifications",
  protect,
  updateNotifications
);


module.exports = router;
