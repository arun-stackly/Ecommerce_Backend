const express = require("express");
const router = express.Router();

const subSubController = require("../controllers/subsubcategoriesController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
// Create SubSubcategory
router.post("/", adminAuthMiddleware, subSubController.createSubSubcategory);

// Get all SubSubcategories
router.get("/",  adminAuthMiddleware, subSubController.getSubSubcategories);

// Get SubSubcategories by Subcategory
router.get("/subcategory/:subcategoryId", subSubController.getBySubcategory);


// Get SubSubcategories by category
router.get("/category/:categoryId", subSubController.getByCategory);

// Update SubSubcategory
router.put("/:id", adminAuthMiddleware, subSubController.updateSubSubcategory);

// Delete SubSubcategory
router.delete("/:id",  adminAuthMiddleware, subSubController.deleteSubSubcategory);

module.exports = router;