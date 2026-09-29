const express = require("express");
 
const router = express.Router();
 
const { getHomePage } = require("../controllers/fashionHomepageController");
 
/* ==========================================
   FASHION HOME PAGE
========================================== */
 
router.get("/:categoryId", getHomePage);
 
module.exports = router;
 
 