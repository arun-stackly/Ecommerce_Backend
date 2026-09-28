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

    /* ================= PRODUCT IMAGES ================= */

    const productImages = req.files?.images || [];

    for (const file of productImages) {
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

    /* ================= BRAND LOGO ================= */

    let brand = {};

    if (req.body.brand) {
      try {
        brand =
          typeof req.body.brand === "string"
            ? JSON.parse(req.body.brand)
            : req.body.brand;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid brand JSON",
        });
      }
    }

    const brandLogoFile = req.files?.brandLogo?.[0];

    if (brandLogoFile) {
      const extension = brandLogoFile.originalname.includes(".")
        ? brandLogoFile.originalname.split(".").pop().toLowerCase()
        : "";

      const uniqueFileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}` +
        `${extension ? "." + extension : ""}`;

      const brandLogoKey =
        `brands/${req.user._id}/${uniqueFileName}`;

      await uploadToS3(
        brandLogoFile,
        brandLogoKey
      );

      brand.logo = brandLogoKey;
    }

    /* ================= PARSE ARRAYS ================= */

    let sizes = req.body.sizes;
    let colours = req.body.colours;

    if (typeof sizes === "string") {
      try {
        sizes = JSON.parse(sizes);
      } catch (error) {
        sizes = [sizes];
      }
    }

    if (typeof colours === "string") {
      try {
        colours = JSON.parse(colours);
      } catch (error) {
        colours = [colours];
      }
    }
    let compliance = req.body.compliance;

if (typeof compliance === "string") {
  try {
    compliance = JSON.parse(compliance);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid compliance JSON",
    });
  }
}

    /* ================= CREATE INVENTORY ================= */

    const inventoryData = {
      ...req.body,
      seller: req.user._id,
      sizes,
      colours,
      brand,
      media,
      compliance,
    };

    const inventoryItem =
      await SellerInventory.create(inventoryData);

    /* ================= RESPONSE ================= */

    const responseItem =
      inventoryItem.toObject();

    /* Signed product images */
    if (responseItem.media?.length) {
      responseItem.media = await Promise.all(
        responseItem.media.map(async (item) => {
          if (item.url) {
            return {
              ...item,
              url: await getS3SignedUrl(item.url),
            };
          }

          return item;
        })
      );
    }

    /* Signed brand logo */
    if (responseItem.brand?.logo) {
      responseItem.brand.logo =
        await getS3SignedUrl(
          responseItem.brand.logo
        );
    }

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      inventoryItem: responseItem,
    });

  } catch (error) {
    console.error(
      "Create Inventory Error:",
      error
    );

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
          brand: {
  name: "$brand.name",
  logo: "$brand.logo"
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
      /* Brand logo */
  if (item.brand?.logo) {
    item.brand.logo =
      await getS3SignedUrl(
        item.brand.logo
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
 /* ================= SIGN BRAND LOGO ================= */

if (
  inventoryObject.brand &&
  inventoryObject.brand.logo
) {
  inventoryObject.brand.logo =
    await getS3SignedUrl(
      inventoryObject.brand.logo
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

exports.updateInventoryItem = async (req, res) => {
  try {
    /* =====================================================
       FIND PRODUCT
    ===================================================== */

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

    /* =====================================================
       UPDATE DATA
       Only fields sent in request will be updated.
    ===================================================== */

    const updateData = {
      ...req.body,
    };

    /* =====================================================
       PARSE SIZES
    ===================================================== */

    if (typeof updateData.sizes === "string") {
      try {
        updateData.sizes = JSON.parse(updateData.sizes);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid sizes JSON",
        });
      }
    }

    /* =====================================================
       PARSE COLOURS
    ===================================================== */

    if (typeof updateData.colours === "string") {
      try {
        updateData.colours = JSON.parse(updateData.colours);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid colours JSON",
        });
      }
    }

    /* =====================================================
       PARSE COMPLIANCE
    ===================================================== */

    if (typeof updateData.compliance === "string") {
      try {
        updateData.compliance = JSON.parse(
          updateData.compliance
        );
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid compliance JSON",
        });
      }
    }

    /* =====================================================
       BRAND DATA
       Existing logo is preserved if only brand name changes.
    ===================================================== */

    let brand = {};

    if (inventoryItem.brand) {
      brand = inventoryItem.brand.toObject
        ? inventoryItem.brand.toObject()
        : { ...inventoryItem.brand };
    }

    if (req.body.brand) {
      try {
        const incomingBrand =
          typeof req.body.brand === "string"
            ? JSON.parse(req.body.brand)
            : req.body.brand;

        brand = {
          ...brand,
          ...incomingBrand,
        };
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid brand JSON",
        });
      }
    }

    /* =====================================================
       BRAND LOGO UPDATE
    ===================================================== */

    const brandLogoFile =
      req.files?.brandLogo?.[0];

    if (brandLogoFile) {
      /* Delete old brand logo */

      if (
        inventoryItem.brand &&
        inventoryItem.brand.logo
      ) {
        try {
          await deleteFromS3(
            inventoryItem.brand.logo
          );
        } catch (error) {
          console.error(
            "Failed to delete old brand logo:",
            error.message
          );
        }
      }

      /* Generate new brand logo key */

      const extension =
        brandLogoFile.originalname.includes(".")
          ? brandLogoFile.originalname
              .split(".")
              .pop()
              .toLowerCase()
          : "";

      const uniqueFileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}` +
        `${extension ? "." + extension : ""}`;

      const brandLogoKey =
        `brands/${req.user._id}/${uniqueFileName}`;

      await uploadToS3(
        brandLogoFile,
        brandLogoKey
      );

      brand.logo = brandLogoKey;
    }

    updateData.brand = brand;

    /* =====================================================
       PRODUCT IMAGE UPDATE
       
       Supports individual image replacement.

       Send:
       replaceImageId = existing media _id
       images = new image file
    ===================================================== */

    const productImages =
      req.files?.images || [];

    const replaceImageId =
      req.body.replaceImageId;

    if (productImages.length > 0) {

      /* =================================================
         INDIVIDUAL IMAGE REPLACEMENT
      ================================================= */

      if (replaceImageId) {

        if (productImages.length > 1) {
          return res.status(400).json({
            success: false,
            message:
              "Only one image can be uploaded when replacing a single image",
          });
        }

        const existingMedia =
          inventoryItem.media?.find(
            (media) =>
              media._id &&
              media._id.toString() ===
                replaceImageId
          );

        if (!existingMedia) {
          return res.status(404).json({
            success: false,
            message:
              "Image to replace not found",
          });
        }

        const file = productImages[0];

        /* Generate new S3 key */

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
          `${extension ? "." + extension : ""}`;

        const newKey =
          `seller-inventories/${req.user._id}/${uniqueFileName}`;

        /* Upload new image */

        await uploadToS3(
          file,
          newKey
        );

        /* Delete old S3 image */

        if (existingMedia.url) {
          try {
            await deleteFromS3(
              existingMedia.url
            );
          } catch (error) {
            console.error(
              "Failed to delete old product image:",
              error.message
            );
          }
        }

        /* Replace only selected image */

        const updatedMedia =
          inventoryItem.media.map(
            (media) => {
              if (
                media._id &&
                media._id.toString() ===
                  replaceImageId
              ) {
                return {
                  ...media.toObject?.()
                    ? media.toObject()
                    : media,
                  url: newKey,
                  type: "image",
                };
              }

              return media;
            }
          );

        updateData.media = updatedMedia;
      }

      /* =================================================
         NO replaceImageId
         
         This means user wants to replace ALL images.
         Existing behavior is preserved.
      ================================================= */

      else {

        const newMedia = [];

        for (const file of productImages) {

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
            `${extension ? "." + extension : ""}`;

          const key =
            `seller-inventories/${req.user._id}/${uniqueFileName}`;

          await uploadToS3(
            file,
            key
          );

          newMedia.push({
            url: key,
            type: "image",
          });
        }

        /* Delete all old product images */

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
    }

    /* =====================================================
       UPDATE DATABASE
    ===================================================== */

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

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    /* =====================================================
       RESPONSE OBJECT
    ===================================================== */

    const responseItem =
      updatedItem.toObject();

    /* =====================================================
       SIGN PRODUCT IMAGES
    ===================================================== */

    if (
      responseItem.media &&
      responseItem.media.length > 0
    ) {
      responseItem.media =
        await Promise.all(
          responseItem.media.map(
            async (media) => {

              if (
                media.url &&
                media.type === "image"
              ) {
                return {
                  ...media,
                  url:
                    await getS3SignedUrl(
                      media.url
                    ),
                };
              }

              return media;
            }
          )
        );
    }

    /* =====================================================
       SIGN BRAND LOGO
    ===================================================== */

    if (
      responseItem.brand &&
      responseItem.brand.logo
    ) {
      responseItem.brand.logo =
        await getS3SignedUrl(
          responseItem.brand.logo
        );
    }

    /* =====================================================
       RESPONSE
    ===================================================== */

    res.status(200).json({
      success: true,
      message:
        "Inventory item updated successfully",
      inventoryItem: responseItem,
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

exports.deleteInventoryItem = async (req, res) => {
  try {

    /* =====================================================
       FIND PRODUCT
    ===================================================== */

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

    /* =====================================================
       DELETE PRODUCT IMAGES FROM S3
    ===================================================== */

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
              "Failed to delete S3 product image:",
              media.url,
              error.message
            );
          }
        }
      }
    }

    /* =====================================================
       DELETE BRAND LOGO FROM S3
    ===================================================== */

    if (
      inventoryItem.brand &&
      inventoryItem.brand.logo
    ) {

      try {

        await deleteFromS3(
          inventoryItem.brand.logo
        );

      } catch (error) {

        console.error(
          "Failed to delete S3 brand logo:",
          inventoryItem.brand.logo,
          error.message
        );
      }
    }

    /* =====================================================
       DELETE MONGODB DOCUMENT
    ===================================================== */

    await SellerInventory.findOneAndDelete({
      _id: req.params.id,
      seller: req.user._id,
    });

    /* =====================================================
       RESPONSE
    ===================================================== */

    res.status(200).json({
      success: true,
      message:
        "Inventory item deleted successfully",
      deletedId: inventoryItem._id,
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