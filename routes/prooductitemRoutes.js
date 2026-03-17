const express = require("express");
const router = express.Router();

const productController = require("../controllers/productitemController");

// Add Product
router.post("/", productController.addProduct);

// Get all products
router.get("/", productController.getProducts);

// Get products by SubSubcategory
router.get("/subsub/:subSubcategoryId", productController.getProductsBySubSubcategory);

router.get("/type/:productType", productController.getProductsByType);
// Update product
router.put("/:id", productController.updateProduct);

// Delete product
router.delete("/:id", productController.deleteProduct);

module.exports = router;