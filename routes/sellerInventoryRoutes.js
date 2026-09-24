const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  createInventoryItem,
  getInventory,
  getInventoryById,
  updateInventoryItem,
  deleteInventoryItem,
  updateInventoryStock,
} = require("../controllers/sellerInventoryController");

const { protect } = require("../middleware/authMiddleware");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});


router.post(
  "/",
  protect,
  upload.array("images", 10),
  createInventoryItem
);


router.get(
  "/",
  protect,
  getInventory
);


router.get(
  "/:id",
  protect,
  getInventoryById
);


router.put(
  "/:id",
  protect,
  upload.array("images", 10),
  updateInventoryItem
);


router.delete(
  "/:id",
  protect,
  deleteInventoryItem
);


router.patch(
  "/:id/update-stock",
  protect,
  updateInventoryStock
);


module.exports = router;