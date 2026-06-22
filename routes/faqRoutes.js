const router = require("express").Router();
const faqController = require("../controllers/FaqController");

router.post("/", faqController.createFaq);
router.get("/", faqController.getFaqs);
router.get("/:id", faqController.getFaqById);
router.put("/:id", faqController.updateFaq);
router.delete("/:id", faqController.deleteFaq);

module.exports = router;