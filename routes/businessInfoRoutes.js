const express = require("express");
const router = express.Router();
const { addBusinessInfo } = require("../controllers/businessInfoController");
const { protect } = require("../middleware/authMiddleware");

router.post("/add", protect, addBusinessInfo);

module.exports = router;
