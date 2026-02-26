const express = require("express");
const router = express.Router();
const dealController = require("../controllers/dealController");

// CRUD
router.post("/add", dealController.addDeal);
router.get("/", dealController.getAllDeals);

// ✅ Special APIs (Put BEFORE :id)
router.get("/top-week", dealController.getTopWeekDeal);
router.get("/upcoming", dealController.getUpcomingDeals);
router.get("/brand/:brand", dealController.getDealsByBrand);

// ❗ Keep this LAST
router.get("/:id", dealController.getDealById);
router.put("/update/:id", dealController.updateDeal);
router.delete("/delete/:id", dealController.deleteDeal);

module.exports = router;