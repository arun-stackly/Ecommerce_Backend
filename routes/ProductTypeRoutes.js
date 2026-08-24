const express =
  require("express");

const router =
  express.Router();

const controller =
  require(
    "../controllers/ProductTypeController",
  );
const adminAuthMiddleware = require("../middleware/adminAuthMiddleware");


router.post(
  "/",
 adminAuthMiddleware,  controller.createProductType,
);

router.get(
  "/",
  adminAuthMiddleware, controller.getProductTypes,
);

router.get(
  "/subcategory/:subcategoryId",
  controller.getProductTypesBySubcategory,
);
router.get(
  "/subsubcategory/:subSubcategoryId",
  controller.getProductTypesBySubSubcategory
);

router.put(
  "/:id",
  adminAuthMiddleware, controller.updateProductType,
);

router.delete(
  "/:id",
 adminAuthMiddleware,  controller.deleteProductType,
);
router.get(
  "/:productTypeId/products",
  controller.getProductsByProductType
);
module.exports = router;