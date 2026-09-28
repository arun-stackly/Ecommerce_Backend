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
  upload.fields([
    {
      name: "images",
      maxCount: 10
    },
    {
      name: "brandLogo",
      maxCount: 1
    }
  ]),
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
  upload.fields([
    {
      name: "images",
      maxCount: 10
    },
    {
      name: "brandLogo",
      maxCount: 1
    }
  ]),
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