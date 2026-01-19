const express = require("express");
const router = express.Router();

const c = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(sellerOnly);

router.post("/", protect, c.createPayment);
router.get("/", protect, c.getPayments);

module.exports = router;
