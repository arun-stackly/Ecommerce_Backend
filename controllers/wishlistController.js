const mongoose = require("mongoose");
const Wishlist = require("../models/Wishlist");
const SellerInventory = require("../models/SellerInventory");

/* ================= GET WISHLIST ================= */

exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({
      userId: req.user._id,
    }).populate({
      path: "items.sellerInventoryId",
      select:
        "name price media quantity isActive",
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
            item.sellerInventoryId.isActive,
        )

        .map((item) => {
          const inventory =
            item.sellerInventoryId;

          return {
            sellerInventoryId:
              inventory._id,

            name: inventory.name,

            image:
              inventory.media?.find(
                (m) => m.type === "image",
              )?.url || "",

            price: inventory.price,

            isActive:
              inventory.isActive,
          };
        }),
    };

    res.status(200).json({
      success: true,
      data: formattedWishlist,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= ADD TO WISHLIST ================= */

/* ================= ADD TO WISHLIST ================= */

exports.addToWishlist = async (
  req,
  res,
) => {

  try {

    const { sellerInventoryId } =
      req.body;

    /* ===== VALIDATION ===== */

    if (
      !mongoose.Types.ObjectId.isValid(
        sellerInventoryId
      )
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid sellerInventoryId",
      });

    }

    /* ===== CHECK INVENTORY ===== */

    const inventory =
      await SellerInventory.findById(
        sellerInventoryId
      );

    if (
      !inventory ||
      !inventory.isActive
    ) {

      return res.status(404).json({
        success: false,
        message:
          "Product not available",
      });

    }

    /* ===== FIND USER WISHLIST ===== */

    let wishlist =
      await Wishlist.findOne({
        userId: req.user._id,
      });

    /* ===== CREATE WISHLIST ===== */

    if (!wishlist) {

      wishlist =
        await Wishlist.create({
          userId: req.user._id,
          items: [],
        });

    }

    /* ===== CHECK DUPLICATE ===== */

    const alreadyExists =
      wishlist.items.find(
        (item) =>

          item.sellerInventoryId.toString() ===
          sellerInventoryId.toString()
      );

    if (alreadyExists) {

      return res.status(200).json({
        success: true,
        message:
          "Item already in wishlist",
      });

    }

    /* ===== ADD ITEM ===== */

    wishlist.items.push({
      sellerInventoryId,
    });

    await wishlist.save();

    /* ===== POPULATE UPDATED WISHLIST ===== */

    const updatedWishlist =
      await Wishlist.findById(
        wishlist._id
      ).populate({
        path:
          "items.sellerInventoryId",

        select:
          "name price media isActive",
      });

    /* ===== FORMAT RESPONSE ===== */

    const formattedWishlist = {
      userId:
        updatedWishlist.userId,

      items:
        updatedWishlist.items

          .filter(
            (item) =>
              item.sellerInventoryId &&
              item.sellerInventoryId
                .isActive
          )

          .map((item) => {

            const inventory =
              item.sellerInventoryId;

            return {

              sellerInventoryId:
                inventory._id,

              name:
                inventory.name,

              image:
                inventory.media?.find(
                  (m) =>
                    m.type === "image"
                )?.url || "",

              price:
                inventory.price,

              isActive:
                inventory.isActive,
            };

          }),
    };

 res.status(201).json({
  success: true,
  message: "Item added to wishlist",

  item: {
    sellerInventoryId: inventory._id,
    name: inventory.name,
    image:
      inventory.media?.find(
        (m) => m.type === "image"
      )?.url || "",
    price: inventory.price,
    isActive: inventory.isActive,
  },
});

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

/* ================= REMOVE FROM WISHLIST ================= */

exports.removeFromWishlist =
  async (req, res) => {

    try {

      const {
        sellerInventoryId,
      } = req.params;

      /* ===== VALIDATION ===== */

      if (
        !mongoose.Types.ObjectId.isValid(
          sellerInventoryId
        )
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Invalid sellerInventoryId",
        });

      }

      /* ===== FIND WISHLIST ===== */

      const wishlist =
        await Wishlist.findOne({
          userId: req.user._id,
        });

      if (!wishlist) {

        return res.status(404).json({
          success: false,
          message:
            "Wishlist not found",
        });

      }

      /* ===== REMOVE ITEM ===== */

      wishlist.items =
        wishlist.items.filter(
          (item) =>

            item.sellerInventoryId.toString() !==
            sellerInventoryId.toString()
        );

      await wishlist.save();

      /* ===== GET UPDATED WISHLIST ===== */

      const updatedWishlist =
        await Wishlist.findById(
          wishlist._id
        ).populate({
          path:
            "items.sellerInventoryId",

          select:
            "name price media isActive",
        });

      /* ===== FORMAT RESPONSE ===== */

      const formattedWishlist = {

        userId:
          updatedWishlist.userId,

        items:
          updatedWishlist.items

            .filter(
              (item) =>
                item.sellerInventoryId &&
                item.sellerInventoryId
                  .isActive
            )

            .map((item) => {

              const inventory =
                item.sellerInventoryId;

              return {

                sellerInventoryId:
                  inventory._id,

                name:
                  inventory.name,

                image:
                  inventory.media?.find(
                    (m) =>
                      m.type === "image"
                  )?.url || "",

                price:
                  inventory.price,

                isActive:
                  inventory.isActive,
              };

            }),
      };

      res.status(200).json({
        success: true,
        message:
          "Item removed from wishlist",

        data: formattedWishlist,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }

  };