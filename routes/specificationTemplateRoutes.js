const express = require("express");
const router = express.Router();

const {
  addTemplate,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  getAllTemplates,
} = require("../controllers/SpecificationTemplateController");

/* ==============================
   SPECIFICATION TEMPLATE ROUTES
============================== */

// Create Template
router.post("/", addTemplate);

// Get Single Template
// Example:
// /api/specification-template?productTypeId=xxxx
// OR
// /api/specification-template?subSubCategoryId=xxxx
router.get("/", getTemplate);

// Update Template
router.put("/", updateTemplate);

// Delete Template
router.delete("/", deleteTemplate);

// Get All Templates
router.get("/all", getAllTemplates);

module.exports = router;