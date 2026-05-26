const express = require("express");
const router = express.Router();
const userController = require("../controllers/userlandingController");

router.get("/featured", userController.getFeaturedProducts);

router.get("/top-deals", userController.getTopDeals);

router.get("/weekly-deals", userController.getWeeklyDeals);

router.get("/upcoming-deals", userController.getUpcomingDeals);

router.get("/categories", userController.getCategories);
// get latest products means 

router.get("/recommended", userController.getRecommendedProducts);

module.exports = router;