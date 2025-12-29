const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subsubcategoriesController');

router.post('/:category/:subcategory', ctrl.createOrUpdateSubSubcategory);
router.get('/:category/:subcategory', ctrl.getSubSubcategory);
router.delete('/:id', ctrl.deleteById);

module.exports = router;
