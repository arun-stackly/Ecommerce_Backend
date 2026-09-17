const express = require("express");

const router = express.Router();

const adController = require("../controllers/adsController");

const { protect } = require("../middleware/authMiddleware");

const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

const upload = require("../middleware/upload");


// =====================================================
// GET PRODUCTS FOR AD
// =====================================================

router.get(
  "/products",
  adController.getProductsForAd
);


// =====================================================
// CREATE AD
// POST /api/ads
//
// multipart/form-data
// image = File
// =====================================================

router.post(
  "/",
  protect,
  upload.single("image"),
  adController.createAd
);


// =====================================================
// CREATE MULTIPLE ADS
// =====================================================

router.post(
  "/bulk",
  protect,
  adController.createMultipleAds
);


// =====================================================
// GET SELLER ADS
// =====================================================

router.get(
  "/my-ads",
  protect,
  adController.getSellerAds
);


// =====================================================
// GET ACTIVE ADS
// =====================================================

router.get(
  "/active",
  adController.getActiveAds
);


// =====================================================
// GET AD BY ID
// =====================================================

router.get(
  "/:id",
  protect,
  adController.getAdById
);


// =====================================================
// UPDATE AD
// =====================================================

router.put(
  "/:id/update",
  protect,
  adController.updateAd
);


// =====================================================
// PAUSE AD
// =====================================================

router.patch(
  "/:id/pause",
  protect,
  adController.pauseAd
);


// =====================================================
// RESUME AD
// =====================================================

router.patch(
  "/:id/resume",
  protect,
  adController.resumeAd
);


// =====================================================
// DELETE AD - ADMIN
// =====================================================

router.delete(
  "/:id",
  adminAuthMiddleware,
  protect,
  adController.deleteAd
);


module.exports = router;