const express = require("express");
const router = express.Router();

const { addBankDetails } = require("../controllers/bankController");
const { protectAsync } = require("../middleware/authMiddleware");

router.post("/add", protectAsync, addBankDetails);

module.exports = router;
