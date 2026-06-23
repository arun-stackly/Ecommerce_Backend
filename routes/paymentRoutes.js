const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

const { protectUser } = require("../middleware/userAuthMiddleware");

router.use(protectUser);

router.post("/create", paymentController.createPayment);

router.post("/verify-payment", paymentController.verifyPayment);
router.post("/verify", paymentController.verifyPayments);
// router.post("/card/create", paymentController.cardPayment);

// router.post("/card/verify", paymentController.verifyCardPayment);

module.exports = router;
