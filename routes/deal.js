const express = require('express');
const { addDeal, getDeals, getDealById } = require('../controllers/dealController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/', protect, addDeal);
router.get('/', getDeals);
router.get('/:id', getDealById);

module.exports = router;