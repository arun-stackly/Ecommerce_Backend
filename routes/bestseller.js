const express = require('express');
const {
  getTopDealOfTheDay,
  getBestSellerSmartphones,
  getAccessoryBestSellers
} = require('../controllers/bestSellerController');
const router = express.Router();

router.get('/top-deal', getTopDealOfTheDay);
router.get('/smartphones', getBestSellerSmartphones);
router.get('/accessories', getAccessoryBestSellers);

module.exports = router;
