const express = require("express");
const router = express.Router();

const c = require("../controllers/invoiceController");
const { protect } = require("../middleware/authMiddleware");
const { sellerOnly } = require("../middleware/roleMiddleware");


router.use(protect);
router.use(sellerOnly);


router.post("/generate", c.generateInvoice); 
router.get("/", c.getInvoices); 

module.exports = router;
