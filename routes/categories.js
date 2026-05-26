const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/categoriesController');

router.get('/', ctrl.getCategories);
router.post('/', ctrl.createCategory);
router.put('/:id', ctrl.updateCategory);
router.delete('/:id', ctrl.deleteCategory);
router.get("/:categoryId/price-ranges",
  ctrl.getPriceRanges)
router.get(
  "/:categoryId/by-price",
  ctrl.getProductsByPriceRange
);
router.get(
  "/:categoryId/in-stock",
  ctrl.getInStockProducts
);
router.get(
  "/:categoryId/brands",
  ctrl.getBrandsByCategory
);

router.get(
  "/:categoryId/brands/:brandName/products",
  ctrl.getProductsByBrand
);
module.exports = router;
