const express = require("express");

const router = express.Router();

const {
  getCategorySummary,
  getCategoriesWithProductCount
} = require("../controllers/adminCategoryController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
router.get("/summary",adminAuthMiddleware, getCategorySummary);
router.get("/categories-count",adminAuthMiddleware, getCategoriesWithProductCount);
module.exports = router;