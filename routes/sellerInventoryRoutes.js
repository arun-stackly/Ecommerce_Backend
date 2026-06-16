const express = require("express");
const router = express.Router();
 
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");
 
const {
  createInventoryItem,
  getInventory,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryById,
  updateInventoryStock,
} = require("../controllers/sellerInventoryController");
 
router.use(protect);
router.use(sellerOnly);
 
router.post("/", createInventoryItem);
 
router.get("/", getInventory);
 
router.get("/:id", getInventoryById);
 
router.put("/:id", updateInventoryItem);
 
router.patch("/:id/update-stock", updateInventoryStock);
 
router.delete("/:id", deleteInventoryItem);
 
module.exports = router;
 
 