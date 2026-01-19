const express = require("express");
const router = express.Router();

const c = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(sellerOnly);

router.post("/", c.createOrder);
router.get("/", c.getOrders);
router.get("/:id", c.getOrderById);
router.patch("/:id/status", c.updateOrderStatus);

module.exports = router;
