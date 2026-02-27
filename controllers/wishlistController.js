const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");

/* ================= GET WISHLIST ================= */
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate("products");

    if (!wishlist) {
      return res.json({
        userId: req.user._id,
        products: [],
      });
    }

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const result = await Wishlist.updateOne(
      { userId: req.user._id },
      { $addToSet: { products: productId } },
      { upsert: true }
    );

    if (result.modifiedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "Product already in wishlist",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product added to wishlist successfully",
      productId,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* ================= REMOVE FROM WISHLIST ================= */
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const result = await Wishlist.updateOne(
      { userId: req.user._id },
      { $pull: { products: productId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "Product not found in wishlist" });
    }

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};