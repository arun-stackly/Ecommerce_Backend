const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminsalesReportController");

// Sales Reports & Analytics
router.get("/", controller.getSalesAnalytics);

// Export Report
router.get("/export", controller.exportSalesReport);

module.exports = router;