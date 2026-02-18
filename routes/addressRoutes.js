const express = require("express");
const router = express.Router();

const { protectUser } = require("../middleware/userAuthMiddleware");

const {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/addressController");

router.use(protectUser);

router.get("/", getAddresses);
router.post("/", addAddress);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

router.put("/default/:id", setDefaultAddress);

module.exports = router;
