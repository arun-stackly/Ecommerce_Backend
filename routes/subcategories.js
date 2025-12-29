const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subcategoriesController');

router.post('/:category', ctrl.createSubcategoriesForCategory);
router.get('/:category', ctrl.getSubcategoriesForCategory);
router.put('/:id', ctrl.updateSubcategory);
router.delete('/:id', ctrl.deleteSubcategory);

module.exports = router;
