const ProductItem =
  require("../models/ProductItem");

const SellerInventory =
  require("../models/SellerInventory");

const Banner =
  require("../models/Banner");

  const mongoose =
  require("mongoose");


// =======================================================
// 1. MONTHLY BANNER
// GET /api/mobilehome/banner
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
        message: error.message,
      });

    }

  };


// =======================================================
// 2. TOP DEAL OF THE DAY
// GET /api/mobilehome/topdeal
// =======================================================

exports.getTopDeal =
  async (req, res) => {

    try {

      // Find featured inventory

      const featuredInventory =
        await SellerInventory.findOne({

          isFeatured: true,
          isActive: true,

        }).sort({
          createdAt: -1,
        });

      if (!featuredInventory) {

        return res.status(404).json({
          success: false,
          message:
            "No featured product found",
        });

      }

      // Find product item linked to inventory

      const topDeal =
        await ProductItem.findOne({

          sellerInventory:
            featuredInventory._id,

        })

          .populate(
            "sellerInventory"
          )

          .populate("category")

          .populate("subcategory")

          .populate("subSubcategory")

          .populate("productType");

      if (!topDeal) {

        return res.status(404).json({
          success: false,
          message:
            "No product item found",
        });

      }

      res.status(200).json({
        success: true,
        topDeal,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }

  };


// =======================================================
// 3. BEST SMARTPHONE BRANDS
// GET /api/mobilehome/bestbrands
// =======================================================

exports.getBestBrands =
  async (req, res) => {

    try {

      const mobileSubSubcategoryId =
        "6a0427b9bf8148a68a2d3ccd";

      // STEP 1
      // Find product items

      const productItems =
        await ProductItem.find({

          subSubcategory:
            mobileSubSubcategoryId,

        }).populate(
          "sellerInventory"
        );

      // STEP 2
      // Extract brands

      const brandMap = {};

      productItems.forEach(
        (item) => {

          if (
            item.sellerInventory &&
            item.sellerInventory.brands
          ) {

            item.sellerInventory.brands.forEach(
              (brand) => {

                if (
                  !brandMap[
                    brand.name
                  ]
                ) {

                  brandMap[
                    brand.name
                  ] = {

                    name:
                      brand.name,

                    logo:
                      brand.logo,

                    totalProducts: 0,

                  };

                }

                brandMap[
                  brand.name
                ].totalProducts += 1;

              }
            );

          }

        }
      );

      // Convert object to array

      const brands =
        Object.values(
          brandMap
        );

      res.status(200).json({
        success: true,
        brands,
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
// GET /api/mobilehome/brand/:brandName
// =======================================================

exports.getBrandProducts =
  async (req, res) => {

    try {

      const { brandName } =
        req.params;

      // STEP 1
      // Find seller inventories
      // matching brand

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

      // No inventory found

      if (
        inventories.length === 0
      ) {

        return res.status(404).json({
          success: false,
          message:
            `No ${brandName} products found`,
        });

      }

      // Extract inventory IDs

      const inventoryIds =
        inventories.map(
          (item) => item._id
        );

      // STEP 2
      // Find matching ProductItems

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

      res.status(200).json({
        success: true,
        count: products.length,
        products,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }

  };