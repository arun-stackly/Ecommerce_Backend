const express = require("express");
const {
  getSpecifications,
  filterBySpecifications,
} = require("../controllers/specificationController");
const router = express.Router();

router.get("/filter", filterBySpecifications);
router.get("/:id", getSpecifications);

module.exports = router;
