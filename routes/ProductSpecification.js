const express = require("express");
const router = express.Router();

const {
  addSpecifications,
  getSpecifications,
  updateSpecifications,
  deleteSpecifications
} = require("../controllers/ProductSpecificationController");

// Create
router.post("/:productId", addSpecifications);

// Read
router.get("/:productId", getSpecifications);

// Update
router.put("/:productId", updateSpecifications);

// Delete
router.delete("/:productId", deleteSpecifications);

module.exports = router;