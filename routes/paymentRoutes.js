const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

const { protectUser } = require("../middleware/userAuthMiddleware");

router.use(protectUser);

router.post("/create", paymentController.createPayment);

router.post("/verify", paymentController.verifyPayment);

module.exports = router;
