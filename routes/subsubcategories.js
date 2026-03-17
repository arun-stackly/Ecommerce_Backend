const express = require("express");
const router = express.Router();

const subSubController = require("../controllers/subsubcategoriesController");

// Create SubSubcategory
router.post("/", subSubController.createSubSubcategory);

// Get all SubSubcategories
router.get("/", subSubController.getSubSubcategories);

// Get SubSubcategories by Subcategory
router.get("/subcategory/:subcategoryId", subSubController.getBySubcategory);

// Update SubSubcategory
router.put("/:id", subSubController.updateSubSubcategory);

// Delete SubSubcategory
router.delete("/:id", subSubController.deleteSubSubcategory);

module.exports = router;