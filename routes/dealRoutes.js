const express = require("express");
const router = express.Router();
const dealController = require("../controllers/dealController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

// CRUD
router.post("/add", protect, dealController.addDeal);
router.get("/", protect, dealController.getAllDeals);



// ✅ Special APIs (Put BEFORE :id)
router.get("/top-week", dealController.getTopWeekDeal);
router.get("/upcoming", dealController.getUpcomingDeals);
router.get("/brand/:brand", dealController.getDealsByBrand);

// ❗ Keep this LAST
router.get("/:id", dealController.getDealById);
router.put("/update/:id", protect, dealController.updateDeal);
router.delete("/delete/:id",protect,  dealController.deleteDeal);

module.exports = router;