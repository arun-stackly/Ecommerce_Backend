const mongoose = require("mongoose");
const SellerInventory = require("../models/SellerInventory");

/* =======================================
   CREATE INVENTORY ITEM
======================================= */

exports.createInventoryItem = async (
  req,
  res,
) => {
  try {
    console.log(
      "Incoming Body:",
      req.body,
    );

    const inventoryItem =
      await SellerInventory.create({
        ...req.body,

        seller: req.user._id,
      });

    res.status(201).json({
      success: true,

      message:
        "Inventory item created successfully",

      inventoryItem,
    });

  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/* =======================================
   GET SELLER INVENTORY
======================================= */

exports.getInventory = async (
  req,
  res,
) => {
  try {
    const sellerId =
      req.user._id;

   const inventory =
  await SellerInventory.aggregate([

    {
      $match: {
        seller: new mongoose.Types.ObjectId(
          sellerId
        ),
      },
    },

    // CATEGORY LOOKUP
    {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "category"
      }
    },
    {
      $unwind: {
        path: "$category",
        preserveNullAndEmptyArrays: true
      }
    },

    // SUBCATEGORY LOOKUP
    {
      $lookup: {
        from: "subcategories",
        localField: "subcategory",
        foreignField: "_id",
        as: "subcategory"
      }
    },
    {
      $unwind: {
        path: "$subcategory",
        preserveNullAndEmptyArrays: true
      }
    },

    // SUB SUB CATEGORY LOOKUP
    {
      $lookup: {
        from: "subsubcategories",
        localField: "subSubcategory",
        foreignField: "_id",
        as: "subSubcategory"
      }
    },
    {
      $unwind: {
        path: "$subSubcategory",
        preserveNullAndEmptyArrays: true
      }
    },

    // YOUR SALES LOOKUP
    {
      $lookup: {
        from: "userorders",
        let: {
          productId: "$_id",
        },

        pipeline: [
          {
            $unwind: "$items",
          },

          {
            $match: {
              $expr: {
                $eq: [
                  "$items.sellerInventoryId",
                  "$$productId",
                ],
              },
            },
          },

          {
            $group: {
              _id: null,

              totalSold: {
                $sum: "$items.quantity",
              },
            },
          },
        ],

        as: "sales",
      },
    },
  ]);

    res.status(200).json({
      success: true,

      inventory,
    });

  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

/* =======================================
   UPDATE INVENTORY ITEM
======================================= */

exports.updateInventoryItem =
  async (req, res) => {
    try {
      const inventoryItem =
        await SellerInventory.findOneAndUpdate(
          {
            _id: req.params.id,

            seller:
              req.user._id,
          },

          req.body,

          {
            new: true,
          },
        );

      if (!inventoryItem) {
        return res.status(404).json({
          success: false,

          message:
            "Inventory item not found",
        });
      }

      res.status(200).json({
        success: true,

        message:
          "Inventory item updated successfully",

        inventoryItem,
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  };

/* =======================================
   DELETE INVENTORY ITEM
======================================= */

exports.deleteInventoryItem =
  async (req, res) => {
    try {
      const inventoryItem =
        await SellerInventory.findOneAndDelete(
          {
            _id: req.params.id,

            seller:
              req.user._id,
          },
        );

      if (!inventoryItem) {
        return res.status(404).json({
          success: false,

          message:
            "Inventory item not found",
        });
      }

      res.status(200).json({
        success: true,

        message:
          "Inventory item deleted successfully",
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  };