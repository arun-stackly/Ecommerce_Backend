const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/subcategoriesController');
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");

router.post('/:category', adminAuthMiddleware, ctrl.createSubcategoriesForCategory);
router.get('/:category', adminAuthMiddleware, ctrl.getSubcategoriesForCategory);
router.put('/:id', adminAuthMiddleware, ctrl.updateSubcategory);
router.delete('/:id', adminAuthMiddleware, ctrl.deleteSubcategory);

module.exports = router;
