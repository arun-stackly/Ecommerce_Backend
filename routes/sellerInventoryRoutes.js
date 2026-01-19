const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

const {
  createInventoryItem,
  getInventory,
  updateInventoryItem,
  deleteInventoryItem,
} = require("../controllers/sellerInventoryController");

router.use(protect);
router.use(sellerOnly);

router.post("/", createInventoryItem);
router.get("/", getInventory);
router.put("/:id", updateInventoryItem);
router.delete("/:id", deleteInventoryItem);

module.exports = router;
