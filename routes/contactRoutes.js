const router = require("express").Router();
const contactController = require("../controllers/contactController");

router.post("/", contactController.createContactInfo);
router.get("/", contactController.getContactInfo);
router.put("/", contactController.updateContactInfo);
router.delete("/", contactController.deleteContactInfo);

module.exports = router;