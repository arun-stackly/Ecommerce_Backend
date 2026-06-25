const router =
  require("express").Router();

const controller =
  require("../controllers/SpecificationTemplateController");

router.post(
  "/:productTypeId",
  controller.addTemplate
);

router.get(
  "/",
  controller.getAllTemplates
);

router.get(
  "/:productTypeId",
  controller.getTemplate
);

router.put(
  "/:productTypeId",
  controller.updateTemplate
);

router.delete(
  "/:productTypeId",
  controller.deleteTemplate
);

module.exports = router;