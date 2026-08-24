const express = require("express");
const router = express.Router();

const bannerController = require("../controllers/bannerController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
// ADD API
router.post("/add",adminAuthMiddleware, bannerController.addBanner);

// GET Monthly Banner
router.get("/monthly", bannerController.getMonthlyBanner);

// OPTIONAL (query based)
router.get("/", bannerController.getBanners);

router.get("/", adminAuthMiddleware, bannerController.getBanners);
router.put(
  "/:id",adminAuthMiddleware,
  bannerController.updateBanner
);
router.delete(
  "/:id",adminAuthMiddleware,
  bannerController.deleteBanner
);

router.get(
  "/product-type/:productTypeId",
  bannerController.getBannersByProductType
);

// Subcategory Banner
router.get("/subcategory/:subcategoryId", bannerController.getBannersBySubcategory);

// Sub-Subcategory Banner
router.get("/subsubcategory/:subSubcategoryId", bannerController.getBannersBySubSubcategory);
module.exports = router;