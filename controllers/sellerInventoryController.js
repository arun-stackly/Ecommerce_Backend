const mongoose = require("mongoose");
const SellerInventory = require("../models/SellerInventory");

const {
  uploadToS3,
  getS3SignedUrl,
  deleteFromS3,
} = require("../utils/s3Helper");


/* =======================================
   CREATE INVENTORY ITEM
======================================= */

exports.createInventoryItem = async (req, res) => {
  try {
    console.log("Incoming Body:", req.body);

    let media = [];

    /* ================= UPLOAD IMAGES TO S3 ================= */

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const extension = file.originalname.includes(".")
          ? file.originalname.split(".").pop().toLowerCase()
          : "";

        const uniqueFileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}` +
          `${extension ? "." + extension : ""}`;

        const key =
          `seller-inventories/${req.user._id}/${uniqueFileName}`;

        await uploadToS3(file, key);

        media.push({
          url: key,
          type: "image",
        });
      }
    }

    /* ================= CREATE INVENTORY ================= */

    const inventoryData = {
      ...req.body,
      seller: req.user._id,
      media,
    };

    const inventoryItem =
      await SellerInventory.create(inventoryData);

    console.log("Saved Item:", inventoryItem);

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      inventoryItem,
    });
  } catch (error) {
    console.error("Create Inventory Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =======================================
   GET ALL INVENTORY
======================================= */

exports.getInventory = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const inventory = await SellerInventory.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
        },
      },

      /* ================= CATEGORY ================= */

      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },

      /* ================= SUB SUB CATEGORY ================= */

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

      /* ================= SPECIFICATION ================= */

      {
        $lookup: {
          from: "specifications",
          localField: "_id",
          foreignField: "sellerInventoryId",
          as: "specification",
        },
      },

      /* ================= SALES ================= */

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

      /* ================= UI RESPONSE ================= */

      {
        $addFields: {
          unitsSold: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$sales.totalSold",
                  0,
                ],
              },
              "$soldCount",
            ],
          },

          listingStatus: {
            $cond: [
              "$isActive",
              "Active",
              "Inactive",
            ],
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

      /* ================= FINAL RESPONSE ================= */

      {
        $project: {
          _id: 1,

          productName: "$name",

          productTypeId: "$productType",

          subSubcategoryId:
            "$subSubcategory._id",

          category: "$category.name",

          price: 1,

          /* First product image = S3 KEY */
          productImage: {
            $arrayElemAt: [
              {
                $map: {
                  input: {
                    $filter: {
                      input: "$media",
                      as: "m",

                      cond: {
                        $eq: [
                          "$$m.type",
                          "image",
                        ],
                      },
                    },
                  },

                  as: "img",

                  in: "$$img.url",
                },
              },

              0,
            ],
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

    /* ================= GENERATE S3 SIGNED URL ================= */

    for (const item of inventory) {
      if (item.productImage) {
        item.productImage =
          await getS3SignedUrl(
            item.productImage
          );
      }
    }

    res.status(200).json({
      success: true,
      totalProducts: inventory.length,
      inventory,
    });
  } catch (error) {
    console.error("Get Inventory Error:", error);

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
    const inventoryItem =
      await SellerInventory.findOne({
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

    const inventoryObject =
      inventoryItem.toObject();

    /* ================= S3 SIGNED URLS ================= */

    if (
      inventoryObject.media &&
      inventoryObject.media.length > 0
    ) {
      inventoryObject.media =
        await Promise.all(
          inventoryObject.media.map(
            async (item) => {
              if (
                item.type === "image" &&
                item.url
              ) {
                return {
                  ...item,
                  url: await getS3SignedUrl(
                    item.url
                  ),
                };
              }

              return item;
            }
          )
        );
    }

    res.status(200).json({
      success: true,
      inventoryItem: inventoryObject,
    });
  } catch (error) {
    console.error(
      "Get Inventory By ID Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =======================================
   UPDATE INVENTORY ITEM
======================================= */

exports.updateInventoryItem = async (
  req,
  res
) => {
  try {
    const inventoryItem =
      await SellerInventory.findOne({
        _id: req.params.id,
        seller: req.user._id,
      });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    const updateData = {
      ...req.body,
    };

    /* ================= NEW IMAGES ================= */

    if (
      req.files &&
      req.files.length > 0
    ) {
      const newMedia = [];

      for (const file of req.files) {
        const extension =
          file.originalname.includes(".")
            ? file.originalname
                .split(".")
                .pop()
                .toLowerCase()
            : "";

        const uniqueFileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}` +
          `${
            extension
              ? "." + extension
              : ""
          }`;

        const key =
          `seller-inventories/${req.user._id}/${uniqueFileName}`;

        await uploadToS3(file, key);

        newMedia.push({
          url: key,
          type: "image",
        });
      }

      /* ================= DELETE OLD IMAGES ================= */

      if (
        inventoryItem.media &&
        inventoryItem.media.length > 0
      ) {
        for (const media of inventoryItem.media) {
          if (
            media.type === "image" &&
            media.url
          ) {
            try {
              await deleteFromS3(
                media.url
              );
            } catch (error) {
              console.error(
                "Failed to delete old S3 image:",
                error.message
              );
            }
          }
        }
      }

      updateData.media = newMedia;
    }

    /* ================= UPDATE MONGODB ================= */

    const updatedItem =
      await SellerInventory.findOneAndUpdate(
        {
          _id: req.params.id,
          seller: req.user._id,
        },

        updateData,

        {
          new: true,
          runValidators: true,
        }
      );

    res.status(200).json({
      success: true,
      message:
        "Inventory item updated successfully",

      inventoryItem: {
        _id: updatedItem._id,

        productName:
          updatedItem.name,

        price:
          updatedItem.price,

        itemStock:
          updatedItem.quantity,

        listingStatus:
          updatedItem.isActive
            ? "Active"
            : "Inactive",

        media:
          updatedItem.media,
      },
    });
  } catch (error) {
    console.error(
      "Update Inventory Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =======================================
   DELETE INVENTORY ITEM
======================================= */

exports.deleteInventoryItem = async (
  req,
  res
) => {
  try {
    const inventoryItem =
      await SellerInventory.findOne({
        _id: req.params.id,
        seller: req.user._id,
      });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    /* ================= DELETE S3 IMAGES ================= */

    if (
      inventoryItem.media &&
      inventoryItem.media.length > 0
    ) {
      for (const media of inventoryItem.media) {
        if (
          media.type === "image" &&
          media.url
        ) {
          try {
            await deleteFromS3(
              media.url
            );
          } catch (error) {
            console.error(
              "Failed to delete S3 image:",
              error.message
            );
          }
        }
      }
    }

    /* ================= DELETE MONGODB ================= */

    await SellerInventory.findOneAndDelete({
      _id: req.params.id,
      seller: req.user._id,
    });

    res.status(200).json({
      success: true,
      message:
        "Inventory item deleted successfully",

      deletedId:
        inventoryItem._id,
    });
  } catch (error) {
    console.error(
      "Delete Inventory Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =======================================
   UPDATE INVENTORY STOCK
======================================= */

exports.updateInventoryStock = async (
  req,
  res
) => {
  try {
    const {
      action,
      quantity,
    } = req.body;

    /* ================= VALIDATION ================= */

    if (
      !["increase", "decrease"].includes(
        action
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Action must be either 'increase' or 'decrease'",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid quantity",
      });
    }

    /* ================= FIND ITEM ================= */

    const inventoryItem =
      await SellerInventory.findOne({
        _id: req.params.id,
        seller: req.user._id,
      });

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message:
          "Inventory item not found",
      });
    }

    /* ================= DECREASE VALIDATION ================= */

    if (
      action === "decrease" &&
      inventoryItem.quantity < quantity
    ) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    /* ================= STOCK CHANGE ================= */

    const stockChange =
      action === "increase"
        ? quantity
        : -quantity;

    const updatedItem =
      await SellerInventory.findOneAndUpdate(
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
        }
      );

    res.status(200).json({
      success: true,

      message:
        action === "increase"
          ? "Stock increased successfully"
          : "Stock decreased successfully",

      inventoryItem: {
        _id: updatedItem._id,

        productName:
          updatedItem.name,

        itemStock:
          updatedItem.quantity,
      },
    });
  } catch (error) {
    console.error(
      "Update Inventory Stock Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};