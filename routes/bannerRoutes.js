const express = require("express");
const router = express.Router();

const bannerController = require("../controllers/bannerController");

// ADD API
router.post("/add", bannerController.addBanner);

// GET Monthly Banner
router.get("/monthly", bannerController.getMonthlyBanner);

// OPTIONAL (query based)
router.get("/", bannerController.getBanners);

router.get(
  "/:categoryId",
  bannerController.getBannersByCategory
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