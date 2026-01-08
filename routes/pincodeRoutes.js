const router = require("express").Router();
const { getCityState } = require("../controllers/pincodeController");

router.post("/lookup", getCityState);

module.exports = router;