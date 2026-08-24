const express = require("express");

const router = express.Router();

const {
  getCustomerManagement
} = require("../controllers/adminCustomerController");
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");
// GET customer management
router.get("/", adminAuthMiddleware, getCustomerManagement);

module.exports = router;