const express = require("express");
 
const router = express.Router();
 
const bannerController = require("../controllers/bannerController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
const upload = require("../middleware/upload");
 
/* =========================================================
   ADD BANNER
   POST /api/banner/add
========================================================= */
 
router.post(
  "/add",
  adminAuthMiddleware,
  upload.single("image"),
  bannerController.addBanner,
);
 
/* =========================================================
   GET MONTHLY BANNER
   GET /api/banner/monthly
========================================================= */
 
router.get("/monthly", bannerController.getMonthlyBanner);
 
/* =========================================================
   GET ALL BANNERS
   GET /api/banner
========================================================= */
 
router.get("/", bannerController.getBanners);
 
/* =========================================================
   UPDATE BANNER
   PUT /api/banner/:id
========================================================= */
 
router.put(
  "/:id",
  adminAuthMiddleware,
  upload.single("image"),
  bannerController.updateBanner,
);
 
/* =========================================================
   DELETE BANNER
   DELETE /api/banner/:id
========================================================= */
 
router.delete("/:id", adminAuthMiddleware, bannerController.deleteBanner);
/* =========================================================
   GET BANNERS BY category
   GET /api/banner/category/:categoryId
========================================================= */
 
router.get(
  "/category/:categoryId",
  bannerController.getBannersByCategory,
);
 
/* =========================================================
   GET BANNERS BY PRODUCT TYPE
   GET /api/banner/product-type/:productTypeId
========================================================= */
 
router.get(
  "/product-type/:productTypeId",
  bannerController.getBannersByProductType,
);
 
/* =========================================================
   GET BANNERS BY SUBCATEGORY
   GET /api/banner/subcategory/:subcategoryId
========================================================= */
 
router.get(
  "/subcategory/:subcategoryId",
  bannerController.getBannersBySubcategory,
);
 
/* =========================================================
   GET BANNERS BY SUB-SUBCATEGORY
   GET /api/banner/subsubcategory/:subSubcategoryId
========================================================= */
 
router.get(
  "/subsubcategory/:subSubcategoryId",
  bannerController.getBannersBySubSubcategory,
);
 
module.exports = router;
 
 