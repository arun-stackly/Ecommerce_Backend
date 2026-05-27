const express = require("express");
const router = express.Router();

const {
  addSpecifications,
  getSpecifications,
  updateSpecifications,
  deleteSpecifications
} = require("../controllers/ProductSpecificationController");

// Create
router.post("/:sellerInventoryId", addSpecifications);

// Read
router.get("/:sellerInventoryId", getSpecifications);

// Update
router.put("/:sellerInventoryId", updateSpecifications);

// Delete
router.delete("/:sellerInventoryId", deleteSpecifications);

module.exports = router;