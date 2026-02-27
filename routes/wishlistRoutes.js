const express = require("express");
const router = express.Router();

const { protectUser } = require("../middleware/userAuthMiddleware");

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");

router.use(protectUser);

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;