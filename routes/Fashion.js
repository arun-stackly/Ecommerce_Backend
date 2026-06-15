const express = require("express");
const router = express.Router();

const FashionController = require("../controllers/Fashion");




// =======================================
// 2. Get Products By Product Type
// GET /api/category/:producttypeId/products
// =======================================
router.get(
  "/category/:categoryId/products",
  FashionController.getCategoryProducts
);

// =======================================
// 3. Filter Products
// GET /api/category/:producttypeId/filter
// =======================================
router.get(
  "/category/:productTypeId/filter",
  FashionController.getFilteredProducts
);

//=======================================
// 3. Filter Products
// GET /api/category/:producttypeId/filter
// =======================================
router.get(
  "/subcategory/:subcategoryId/filter",
  FashionController.getProductsBySubcategory
);


// =======================================
// 4. Upcoming Deals
// GET /api/category/:producttypeId/deals/upcoming
// =======================================
router.get(
  "/category/:productTypeId/deals/upcoming",
  FashionController.getUpcomingDeals
);


// =======================================
// 5. Top Rated Products
// GET /api/category/:producttypeId/top-rated
// =======================================
router.get(
  "/category/:productTypeId/top-rated",
  FashionController.getTopRatedProducts
);
router.get(
  "/subcategory/:subcategoryId/top-rated",
  FashionController.getTopRatedProductsBySubcategory
);

router.get(
  "/:productTypeId/brands",
  FashionController.getBrandsByProductType
);
router.get(
  "/subcategory/:subcategoryId/brands",
  FashionController.getBrandsBySubcategory
);
module.exports = router;