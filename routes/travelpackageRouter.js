const express = require("express");
const router = express.Router();
const controller = require("../controllers/TravelpackageController");

router.post("/", controller.createTravelPackage);

router.get("/", controller.getTravelPackages);

router.get("/:id", controller.getTravelPackageById);

router.put("/:id", controller.updateTravelPackage);

router.delete("/:id", controller.deleteTravelPackage);

module.exports = router;