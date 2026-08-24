const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminsalesReportController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
// Sales Reports & Analytics
router.get("/",adminAuthMiddleware, controller.getSalesAnalytics);

// Export Report
router.get("/export",adminAuthMiddleware, controller.exportSalesReport);

module.exports = router;