const express =
  require("express");

const router =
  express.Router();

const controller =
  require(
    "../controllers/ProductTypeController",
  );

router.post(
  "/",
  controller.createProductType,
);

router.get(
  "/",
  controller.getProductTypes,
);

router.get(
  "/subcategory/:subcategoryId",
  controller.getProductTypesBySubcategory,
);

router.put(
  "/:id",
  controller.updateProductType,
);

router.delete(
  "/:id",
  controller.deleteProductType,
);

module.exports = router;