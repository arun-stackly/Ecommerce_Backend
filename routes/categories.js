const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/categoriesController");

// Category CRUD
router.get("/", ctrl.getCategories);
router.post("/", ctrl.createCategory);
router.put("/:id", ctrl.updateCategory);
router.delete("/:id", ctrl.deleteCategory);

// Price ranges list
router.get("/:categoryId/price-ranges", ctrl.getPriceRanges);

// ================= PRICE FILTER =================

// Category
router.get(
  "/category/:categoryId/by-price",
  ctrl.getProductsByPriceRange
);

// Subcategory
router.get(
  "/subcategory/:subcategoryId/by-price",
  ctrl.getProductsByPriceRangeAndSubcategory
);

// SubSubcategory
router.get(
  "/subsubcategory/:subSubcategoryId/by-price",
  ctrl.getProductsByPriceRangeAndSubSubcategory
);

// Product Type
router.get(
  "/product-type/:productTypeId/by-price",
  ctrl.getProductsByPriceRangeAndProductType
);

// ================= IN STOCK =================

// Category
router.get(
  "/category/:categoryId/in-stock",
  ctrl.getInStockProducts
);

// Subcategory
router.get(
  "/subcategory/:subcategoryId/in-stock",
  ctrl.getInStockProductsBySubcategory
);

// SubSubcategory
router.get(
  "/subsubcategory/:subSubcategoryId/in-stock",
  ctrl.getInStockProductsBySubSubcategory
);

// Product Type
router.get(
  "/product-type/:productTypeId/in-stock",
  ctrl.getInStockProductsByProductType
);

// ================= BRANDS =================

// Category
router.get(
  "/:categoryId/brands",
  ctrl.getBrandsByCategory
);

router.get(
  "/category/:categoryId/brands/:brandName/products",
  ctrl.getProductsByBrand
);

// Subcategory
router.get(
  "/subcategory/:subcategoryId/brands/:brandName/products",
  ctrl.getProductsByBrandAndSubcategory
);

// SubSubcategory
router.get(
  "/subsubcategory/:subSubcategoryId/brands/:brandName/products",
  ctrl.getProductsByBrandAndSubSubcategory
);

// Product Type
router.get(
  "/product-type/:productTypeId/brands/:brandName/products",
  ctrl.getProductsByBrandAndProductType
);

router.get("/filter", ctrl.getFilteredProducts);

module.exports = router;