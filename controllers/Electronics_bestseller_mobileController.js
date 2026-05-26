const ProductItem =
  require("../models/productitem");

const SellerInventory =
  require("../models/SellerInventory");

const Banner =
  require("../models/Banner");

const Deal =
  require("../models/Deal");

const UserOrder =
  require("../models/UserOrder");

const mongoose =
  require("mongoose");

// =======================================================
// 1. MONTHLY BANNER
// GET /api/bestseller/mobile/banner
// =======================================================

exports.getMonthlyBanner =
  async (req, res) => {

    try {

      const banner =
        await Banner.findOne({

          type: "monthly",

          isActive: true,

        });

      res.status(200).json({

        success: true,

        banner,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,

      });

    }

  };

// =======================================================
// 2. TOP DEAL OF THE DAY
// GET /api/bestseller/mobile/topdeal
// =======================================================

exports.getTopDeal =
  async (req, res) => {

    try {

      // MOBILE PHONES SUBSUBCATEGORY ID

      const mobileSubSubcategoryId =
        "6a0427b9bf8148a68a2d3ccd";

      // FIND TOP DEAL

      const topDeal =
        await Deal.findOne({

          type: "topDeal",

          isActive: true,

        })

          .populate({

            path: "productItem",

            match: {

              subSubcategory:
                mobileSubSubcategoryId,

            },

            populate: [

              {
                path:
                  "sellerInventory",
              },

              {
                path:
                  "category",
              },

              {
                path:
                  "subcategory",
              },

              {
                path:
                  "subSubcategory",
              },

              {
                path:
                  "productType",
              },

            ],

          })

          .sort({
            createdAt: -1,
          });

      // NO DEAL

      if (
        !topDeal ||
        !topDeal.productItem
      ) {

        return res.status(404).json({

          success: false,

          message:
            "No mobile top deal found",

        });

      }

      res.status(200).json({

        success: true,

        topDeal,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,

      });

    }

  };

// =======================================================
// 3. BEST SELLER PRODUCT
// FOR EACH BRAND THIS MONTH
// GET /api/bestseller/mobile/bestbrands
// =======================================================

exports.getBestSellerBrands =
  async (req, res) => {

    try {

      // =====================================
      // CURRENT MONTH START & END
      // =====================================

      const now = new Date();

      const startOfMonth =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

      const endOfMonth =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );

      // =====================================
      // MOBILE PHONES SUBSUBCATEGORY ID
      // =====================================

      const mobileSubSubcategoryId =
        new mongoose.Types.ObjectId(
          "6a0427b9bf8148a68a2d3ccd"
        );

      // =====================================
      // AGGREGATION
      // =====================================

      const bestSellerBrands =
        await UserOrder.aggregate([

          // =================================
          // THIS MONTH VALID ORDERS
          // =================================

          {
            $match: {

              createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth,
              },

              orderStatus: {
                $in: [
                  "placed",
                  "processed",
                  "shipped",
                  "delivered",
                ],
              },

            },
          },

          // =================================
          // UNWIND ITEMS
          // =================================

          {
            $unwind: "$items",
          },

          // =================================
          // GROUP SALES BY PRODUCT
          // =================================

          {
            $group: {

              _id:
                "$items.sellerInventoryId",

              totalSold: {
                $sum:
                  "$items.quantity",
              },

            },
          },

          // =================================
          // LOOKUP SELLER INVENTORY
          // =================================

          {
            $lookup: {

              from:
                "sellerinventories",

              localField: "_id",

              foreignField: "_id",

              as: "inventory",

            },
          },

          // =================================
          // UNWIND INVENTORY
          // =================================

          {
            $unwind: "$inventory",
          },

          // =================================
          // ONLY MOBILE PHONES
          // =================================

          {
            $match: {

              "inventory.subSubcategory":
                mobileSubSubcategoryId,

              "inventory.isActive":
                true,

            },
          },

          // =================================
          // SORT HIGHEST SOLD
          // =================================

          {
            $sort: {
              totalSold: -1,
            },
          },

          // =================================
          // GROUP BY BRAND
          // TAKE TOP PRODUCT
          // =================================

          {
            $group: {

              _id: {
                $arrayElemAt: [
                  "$inventory.brands.name",
                  0,
                ],
              },

              bestProduct: {
                $first: "$$ROOT",
              },

            },
          },

          // =================================
          // FINAL RESPONSE
          // =================================

          {
            $project: {

              _id: 0,

              brand: "$_id",

              totalSold:
                "$bestProduct.totalSold",

              product: {

                inventoryId:
                  "$bestProduct.inventory._id",

                name:
                  "$bestProduct.inventory.name",

                description:
                  "$bestProduct.inventory.description",

                price:
                  "$bestProduct.inventory.price",

                quantity:
                  "$bestProduct.inventory.quantity",

                soldCount:
                  "$bestProduct.totalSold",

                rating:
                  "$bestProduct.inventory.rating",

                reviewCount:
                  "$bestProduct.inventory.reviewCount",

                views:
                  "$bestProduct.inventory.views",

                media:
                  "$bestProduct.inventory.media",

                colours:
                  "$bestProduct.inventory.colours",

                sizes:
                  "$bestProduct.inventory.sizes",

                brands:
                  "$bestProduct.inventory.brands",

                subSubcategory:
                  "$bestProduct.inventory.subSubcategory",

              },

            },
          },

        ]);

      // =====================================
      // RESPONSE
      // =====================================

      res.status(200).json({

        success: true,

        count:
          bestSellerBrands.length,

        data:
          bestSellerBrands,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,

      });

    }

  };

// =======================================================
// 4. BRAND PRODUCTS
// GET /api/bestseller/mobile/brand/:brandName
// =======================================================

exports.getBrandProducts =
  async (req, res) => {

    try {

      const { brandName } =
        req.params;

      // =====================================
      // FIND INVENTORIES
      // =====================================

      const inventories =
        await SellerInventory.find({

          "brands.name": {

            $regex:
              new RegExp(
                `^${brandName}$`,
                "i"
              ),

          },

          isActive: true,

        });

      // =====================================
      // NO PRODUCTS
      // =====================================

      if (
        inventories.length === 0
      ) {

        return res.status(404).json({

          success: false,

          message:
            `No ${brandName} products found`,

        });

      }

      // =====================================
      // INVENTORY IDS
      // =====================================

      const inventoryIds =
        inventories.map(
          (item) => item._id
        );

      // =====================================
      // PRODUCT ITEMS
      // =====================================

      const products =
        await ProductItem.find({

          sellerInventory: {
            $in: inventoryIds,
          },

        })

          .populate(
            "sellerInventory"
          )

          .populate("category")

          .populate("subcategory")

          .populate("subSubcategory")

          .populate("productType")

          .sort({
            createdAt: -1,
          })

          .limit(10);

      // =====================================
      // RESPONSE
      // =====================================

      res.status(200).json({

        success: true,

        brand:
          brandName,

        count:
          products.length,

        products,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,

      });

    }

  };
