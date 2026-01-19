const express = require("express");
const router = express.Router();

const c = require("../controllers/refundController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(sellerOnly);

router.post("/", c.createRefund);
router.get("/", c.getRefunds);
module.exports = router;
