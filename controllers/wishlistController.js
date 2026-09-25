const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const SellerInventory = require("../models/SellerInventory");
const User = require("../models/User");
const { getS3SignedUrl } = require("../utils/s3Helper");

/* ================= GET WISHLIST ================= */

/* ================= GET WISHLIST ================= */

exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      userId: req.user._id,
    }).populate({
      path: "items.sellerInventoryId",
      select:
        "name price discountPrice sizes colours media quantity isActive rating reviewCount",
    });

    // Empty wishlist
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: {
          userId: req.user._id,
          items: [],
        },
      });
    }

    const formattedWishlist = await formatWishlist(wishlist);

    return res.status(200).json({
      success: true,
      data: formattedWishlist,
    });
  } catch (error) {
    console.error("Get Wishlist Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= ADD TO WISHLIST ================= */

exports.addToWishlist = async (req, res) => {
  try {
    const { sellerInventoryId } = req.body;

    /* ===== VALIDATION ===== */
    if (!mongoose.Types.ObjectId.isValid(sellerInventoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sellerInventoryId",
      });
    }

    /* ===== CHECK INVENTORY ===== */
    const inventory = await SellerInventory.findById(sellerInventoryId);

    if (!inventory || !inventory.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not available",
      });
    }

    /* ===== FIND OR CREATE WISHLIST ===== */
    let wishlist = await Wishlist.findOne({
      userId: req.user._id,
    });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: req.user._id,
        items: [],
      });
    }

    /* ===== CHECK DUPLICATE ===== */
    const alreadyExists = wishlist.items.find(
      (item) =>
        item.sellerInventoryId.toString() === sellerInventoryId.toString()
    );

    if (alreadyExists) {
      const existingWishlist = await Wishlist.findById(wishlist._id).populate({
        path: "items.sellerInventoryId",
        select: "name price size colours discountPrice media isActive rating reviewcount",
      });

      return res.status(200).json({
        success: true,
        message: "Item already in wishlist",
        wishlistId: wishlist._id,
        wishlist: await formatWishlist(existingWishlist),
      });
    }

    /* ===== ADD ITEM ===== */
    wishlist.items.push({ sellerInventoryId });
    await wishlist.save();

    /* ===== POPULATE UPDATED WISHLIST ===== */
    const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: "items.sellerInventoryId",
      select: "name price sizes colours discountPrice media isActive rating reviewcount",
    });

    /* ===== FORMAT RESPONSE ===== */
    const responseData = await formatWishlist(updatedWishlist);

    return res.status(201).json({
      success: true,
      message: "Item added to wishlist",
      wishlistId: updatedWishlist._id,
      wishlist: responseData,
    });

  } catch (error) {
    console.error("Wishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* ==============================
   HELPER FUNCTION
   CLEAN FORMAT + S3 IMAGE URL
================================ */

async function formatWishlist(wishlist) {
  const items = await Promise.all(
    wishlist.items
      .filter(
        (item) =>
          item.sellerInventoryId &&
          item.sellerInventoryId.isActive
      )
      .map(async (item) => {
        const inventory = item.sellerInventoryId;

        const price = inventory.price;

        const discountPrice =
          inventory.discountPrice > 0
            ? inventory.discountPrice
            : inventory.price;

        const discountPercentage =
          price > discountPrice
            ? `${Math.round(
                ((price - discountPrice) / price) * 100
              )}%`
            : "0%";

        // =========================
        // S3 IMAGE
        // =========================

        let image = "";

        const imageKey = inventory.media?.find(
          (m) => m.type === "image"
        )?.url;

        if (imageKey) {
          try {
            image = await getS3SignedUrl(imageKey);
          } catch (s3Error) {
            console.error(
              "Wishlist S3 Image Error:",
              s3Error
            );

            image = "";
          }
        }

        return {
          sellerInventoryId: inventory._id,
          name: inventory.name,

          image,

          price,
          discountPrice,
          discountPercentage,

          avgRating: inventory.rating || 0,
          reviewCount: inventory.reviewCount || 0,

          sizes: inventory.sizes || [],
          colours: inventory.colours || [],

          isActive: inventory.isActive,
        };
      })
  );

  return {
    wishlistId: wishlist._id,
    userId: wishlist.userId,
    items,
  };
}
/* ================= REMOVE FROM WISHLIST ================= */
exports.removeFromWishlist = async (req, res) => {
  try {
    const { sellerInventoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerInventoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sellerInventoryId",
      });
    }

    const wishlist = await Wishlist.findOne({
      userId: req.user._id,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found",
      });
    }

    console.log("before:", wishlist.items.length);

    wishlist.items = wishlist.items.filter(
      (item) =>
        item.sellerInventoryId.toString() !== sellerInventoryId
    );

    await wishlist.save();

    const updated = await Wishlist.findById(wishlist._id).populate({
      path: "items.sellerInventoryId",
      select: "name price discountPrice media isActive",
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from wishlist",
      data: await formatWishlist(updated),
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};