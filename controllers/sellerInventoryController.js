const mongoose = require("mongoose");
const SellerInventory = require("../models/SellerInventory");
 
/* =======================================
   CREATE INVENTORY ITEM
======================================= */
 
exports.createInventoryItem = async (req, res) => {
  try {
    console.log("Incoming Body:", req.body);
 
    const inventoryItem = await SellerInventory.create({
      ...req.body,
 
      seller: req.user._id,
    });
    console.log("Saved Item:", inventoryItem);
    res.status(201).json({
      success: true,
 
      message: "Inventory item created successfully",
 
      inventoryItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
 
      message: error.message,
    });
  }
};
 
exports.getInventory = async (req, res) => {
  try {
    const sellerId = req.user._id;
 
    const inventory = await SellerInventory.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
        },
      },
 
      // CATEGORY
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
 
      // SALES CALCULATION
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
                  $eq: ["$items.sellerInventoryId", "$$productId"],
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
 
      // UI RESPONSE FORMAT
      {
        $addFields: {
          unitsSold: {
            $ifNull: [
              {
                $arrayElemAt: ["$sales.totalSold", 0],
              },
              "$soldCount",
            ],
          },
 
          listingStatus: {
            $cond: ["$isActive", "Active", "Inactive"],
          },
 
          stockStatus: {
            $switch: {
              branches: [
                {
                  case: {
                    $eq: ["$quantity", 0],
                  },
                  then: "No Stock",
                },
                {
                  case: {
                    $lte: ["$quantity", 5],
                  },
                  then: "Low Stock",
                },
              ],
              default: "In Stock",
            },
          },
        },
      },
 
      // FINAL RESPONSE
      {
        $project: {
          _id: 1,
 
          productName: "$name",
 
          category: "$category.name",
 
          price: 1,
 
          itemStock: "$quantity",
 
          unitsSold: 1,
 
          listingStatus: 1,
 
          stockStatus: 1,
        },
      },
 
      {
        $sort: {
          _id: -1,
        },
      },
    ]);
 
    res.status(200).json({
      success: true,
      totalProducts: inventory.length,
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
   GET INVENTORY BY ID
======================================= */
 
exports.getInventoryById = async (req, res) => {
  try {
    const inventoryItem = await SellerInventory.findOne({
      _id: req.params.id,
      seller: req.user._id,
    })
      .populate("category")
      .populate("subcategory")
      .populate("subSubcategory")
      .populate("productType");
 
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
 
    res.status(200).json({
      success: true,
      inventoryItem,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =======================================
    UPDATE INVENTORY ITEM
======================================= */
exports.updateInventoryItem = async (req, res) => {
  try {
    const inventoryItem = await SellerInventory.findOneAndUpdate(
      {
        _id: req.params.id,
        seller: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );
 
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
 
    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      inventoryItem: {
        _id: inventoryItem._id,
        productName: inventoryItem.name,
        price: inventoryItem.price,
        itemStock: inventoryItem.quantity,
        listingStatus: inventoryItem.isActive ? "Active" : "Inactive",
      },
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
 
exports.deleteInventoryItem = async (req, res) => {
  try {
    const inventoryItem = await SellerInventory.findOneAndDelete({
      _id: req.params.id,
      seller: req.user._id,
    });
 
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
 
    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
      deletedId: inventoryItem._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 