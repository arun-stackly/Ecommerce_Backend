const express = require('express');
const {
  getProductDetail,
  getSimilarProducts,
  getRecommendedProducts
} = require('../controllers/productDetailController');

const router = express.Router();

router.get('/:id/detail', getProductDetail);
router.get('/similar/:id', getSimilarProducts);
router.get('/recommend', getRecommendedProducts);

module.exports = router;
