const ProductItem =
  require("../models/ProductItem");

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

/* =========================================================
   COMMON MOBILE SUBSUBCATEGORY ID
========================================================= */

const mobileSubSubcategoryId =
  new mongoose.Types.ObjectId(
    "6a0427b9bf8148a68a2d3ccd"
  );

/* =========================================================
   1. MONTHLY BANNER
   GET /api/mobile/banner
========================================================= */

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

/* =========================================================
   2. TOP DEAL OF THE DAY
   GET /api/mobile/topdeal
========================================================= */

exports.getTopDeal =
  async (req, res) => {

    try {

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
/* =========================================================
   3. BEST SELLER BRANDS
   GET /api/bestseller/mobile/bestbrands
========================================================= */

exports.getBestSellerBrands =
  async (req, res) => {

    try {

      // =====================================
      // MOBILE PHONES SUBSUBCATEGORY ID
      // =====================================

      const mobileSubSubcategoryId =
        new mongoose.Types.ObjectId(
          "6a0427b9bf8148a68a2d3ccd"
        );

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
      // AGGREGATION
      // =====================================

      const bestSellerBrands =
        await UserOrder.aggregate([

          // =================================
          // THIS MONTH ORDERS
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
          // ITEMS ARRAY
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
          // SORT HIGHEST SOLD
          // =================================

          {
            $sort: {
              totalSold: -1,
            },
          },

          // =================================
          // LOOKUP INVENTORY
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
          // ONLY MOBILE PRODUCTS
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
          // GROUP BY BRAND
          // TAKE TOP PRODUCT OF EACH BRAND
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


/* =========================================================
   4. TOP RATED PRODUCTS
   GET /api/mobile/brand/:brandName/toprated
========================================================= */

exports.getTopRatedProducts =
  async (req, res) => {

    try {

      const { brandName } =
        req.params;

      const products =
        await ProductItem.find({

          subSubcategory:
            mobileSubSubcategoryId,

        })

          .populate({

            path:
              "sellerInventory",

            match: {

              "brands.name": {

                $regex:
                  new RegExp(
                    `^${brandName}$`,
                    "i"
                  ),

              },

              isActive: true,

            },

          })

          .populate("category")

          .populate("subcategory")

          .populate("subSubcategory")

          .populate("productType");

      const filteredProducts =
        products.filter(
          (item) =>
            item.sellerInventory
        );

      const topRatedProducts =
        filteredProducts

          .sort((a, b) => {

            return (

              b.sellerInventory.rating -

              a.sellerInventory.rating

            );

          })

          .slice(0, 8);

      res.status(200).json({

        success: true,

        count:
          topRatedProducts.length,

        products:
          topRatedProducts,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,

      });

    }

  };

