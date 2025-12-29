const express = require('express');
const { getProducts, addProduct, getProductById } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, addProduct);

module.exports = router;