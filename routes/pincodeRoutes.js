const express = require("express");
const router = express.Router();
const { lookupPincode } = require("../controllers/pincodeController");

router.post("/lookup", lookupPincode);

module.exports = router;
