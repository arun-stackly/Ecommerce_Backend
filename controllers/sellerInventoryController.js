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
      // SUB SUB CATEGORY
{
  $lookup: {
    from: "subsubcategories",
    localField: "subSubcategory",
    foreignField: "_id",
    as: "subSubcategory",
  },
},
{
  $unwind: {
    path: "$subSubcategory",
    preserveNullAndEmptyArrays: true,
  },
},
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
 
      {
  $lookup: {
    from: "specifications",
    localField: "_id",
    foreignField: "sellerInventoryId",
    as: "specification",
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
            case: { $eq: ["$quantity", 0] },
            then: "No Stock",
          },
          {
            case: { $lte: ["$quantity", 5] },
            then: "Low Stock",
          },
        ],
        default: "In Stock",
      },
    },

    hasSpecification: {
      $gt: [
        {
          $size: "$specification",
        },
        0,
      ],
    },

    specificationStatus: {
      $cond: [
        {
          $gt: [
            {
              $size: "$specification",
            },
            0,
          ],
        },
        "Added",
        "Not Added",
      ],
    },
  },
},
      // FINAL RESPONSE
      {
        $project: {
          _id: 1,
 
          productName: "$name",
          productTypeId: "$productType", // <-- add this

           subSubcategoryId: "$subSubcategory._id",
          category: "$category.name",
 
          price: 1,
           productImage: {
      $arrayElemAt: [
        {
          $map: {
            input: {
              $filter: {
                input: "$media",
                as: "m",
                cond: { $eq: ["$$m.type", "image"] }
              }
            },
            as: "img",
            in: "$$img.url"
          }
        },
        0
      ]
    },
 
          itemStock: "$quantity",
 
          unitsSold: 1,
 
          listingStatus: 1,
 
          stockStatus: 1,
           hasSpecification: 1,
    specificationStatus: 1,
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
 
 /* =======================================
   UPDATE INVENTORY STOCK
======================================= */
 
exports.updateInventoryStock = async (req, res) => {
  try {
    const { action, quantity } = req.body;
 
    // Validation
    if (!["increase", "decrease"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be either 'increase' or 'decrease'",
      });
    }
 
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid quantity",
      });
    }
 
    const inventoryItem = await SellerInventory.findOne({
      _id: req.params.id,
      seller: req.user._id,
    });
 
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }
 
    // Decrease stock validation
    if (action === "decrease" && inventoryItem.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }
 
    // Calculate increment value
    const stockChange = action === "increase" ? quantity : -quantity;
 
    const updatedItem = await SellerInventory.findOneAndUpdate(
      {
        _id: req.params.id,
        seller: req.user._id,
      },
      {
        $inc: {
          quantity: stockChange,
        },
      },
      {
        new: true,
      },
    );
 
    res.status(200).json({
      success: true,
      message:
        action === "increase"
          ? "Stock increased successfully"
          : "Stock decreased successfully",
 
      inventoryItem: {
        _id: updatedItem._id,
        productName: updatedItem.name,
        itemStock: updatedItem.quantity,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 