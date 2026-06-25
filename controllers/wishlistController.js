const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const SellerInventory = require("../models/SellerInventory");
const User = require("../models/User");

/* ================= GET WISHLIST ================= */

exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      userId: req.user._id,
    }).populate({
      path: "items.sellerInventoryId",
      select: "name price sizes colours  discountPrice media quantity isActive",
    });

    /* ===== EMPTY WISHLIST ===== */
    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: {
          userId: req.user._id,
          items: [],
        },
      });
    }

    /* ===== FORMAT RESPONSE ===== */
    const formattedWishlist = {
      userId: wishlist.userId,

      items: wishlist.items
        /* ===== REMOVE DELETED / INACTIVE ===== */
        .filter(
          (item) =>
            item.sellerInventoryId &&
            item.sellerInventoryId.isActive
        )

        .map((item) => {
          const inventory = item.sellerInventoryId;

          const price = inventory.price;
          const discountPrice = inventory.discountPrice;

          const discountPercentage =
            price && discountPrice
              ? `${Math.round(
                  ((price - discountPrice) / price) * 100
                )}%`
              : "0%";

          return {
            sellerInventoryId: inventory._id,
            name: inventory.name,
            image:
              inventory.media?.find(
                (m) => m.type === "image"
              )?.url || "",

            price,
            discountPrice,
            discountPercentage, // ✅ added %
            sizes: inventory.sizes || [],
  colours: inventory.colours || [],
            isActive: inventory.isActive,
          };
        }),
    };

    return res.status(200).json({
      success: true,
      data: formattedWishlist,
    });

  } catch (error) {
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
        select: "name price size colours discountPrice media isActive",
      });

      return res.status(200).json({
        success: true,
        message: "Item already in wishlist",
        wishlistId: wishlist._id,
        wishlist: formatWishlist(existingWishlist),
      });
    }

    /* ===== ADD ITEM ===== */
    wishlist.items.push({ sellerInventoryId });
    await wishlist.save();

    /* ===== POPULATE UPDATED WISHLIST ===== */
    const updatedWishlist = await Wishlist.findById(wishlist._id).populate({
      path: "items.sellerInventoryId",
      select: "name price sizes colours discountPrice media isActive",
    });

    /* ===== FORMAT RESPONSE ===== */
    const responseData = formatWishlist(updatedWishlist);

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
   HELPER FUNCTION (CLEAN FORMAT)
================================ */
function formatWishlist(wishlist) {
  return {
    wishlistId: wishlist._id,
    userId: wishlist.userId,
    items: wishlist.items
      .filter((item) => item.sellerInventoryId && item.sellerInventoryId.isActive)
      .map((item) => {
        const inventory = item.sellerInventoryId;

        const price = inventory.price;
        const discountPrice = inventory.discountPrice;

        const discountPercentage =
  price && discountPrice
    ? `${Math.round(((price - discountPrice) / price) * 100)}%`
    : "0%";

        return {
          sellerInventoryId: inventory._id,
          name: inventory.name,
          image:
            inventory.media?.find((m) => m.type === "image")?.url || "",
          price,
          sizes: inventory.sizes || [],
  colours: inventory.colours || [],
          discountPrice,
          discountPercentage,
          isActive: inventory.isActive,
        };
      }),
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
      data: formatWishlist(updated),
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};