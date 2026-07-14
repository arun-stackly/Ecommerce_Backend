const express = require("express");
const router = express.Router();

const controller = require("../controllers/TravelController");

router.post("/", controller.createHomepage);

router.get("/", controller.getAllHomepages);

router.get("/:subcategoryId", controller.getHomepageBySubcategory);

router.put("/:id", controller.updateHomepage);

router.delete("/:id", controller.deleteHomepage);

module.exports = router;