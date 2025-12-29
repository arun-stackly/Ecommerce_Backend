const express = require('express');
const { filterProducts, getBrandBestSellers } = require('../controllers/productController');
const router = express.Router();

router.get('/filter', filterProducts);
router.get('/bestseller', getBrandBestSellers);

module.exports = router;
