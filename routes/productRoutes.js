const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { protectUser } = require("../middleware/userAuthMiddleware");

router.post("/add", productController.addProduct);
router.get("/", productController.getProducts);
router.get("/:id", productController.getSingleProduct);
router.put("/:id", productController.updateProduct);
router.delete("/:id", productController.deleteProduct);
router.post("/:id/review", protectUser, productController.addProductReview);

module.exports = router;