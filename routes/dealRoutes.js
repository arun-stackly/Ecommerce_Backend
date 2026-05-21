const express = require("express");

const router = express.Router();

const dealController =
  require("../controllers/dealController");

const { protect } =
  require("../middleware/authMiddleware");

// ================= CRUD =================

router.post(
  "/add",
  protect,
  dealController.addDeal
);

router.get(
  "/",
  dealController.getAllDeals
);

// ================= SPECIAL APIs =================

router.get(
  "/topdeal",
  dealController.getTopDeal
);

router.get(
  "/upcoming",
  dealController.getUpcomingDeals
);

// ================= SINGLE DEAL =================

router.get(
  "/:id",
  dealController.getDealById
);

router.put(
  "/update/:id",
  protect,
  dealController.updateDeal
);

router.delete(
  "/delete/:id",
  protect,
  dealController.deleteDeal
);

module.exports = router;
