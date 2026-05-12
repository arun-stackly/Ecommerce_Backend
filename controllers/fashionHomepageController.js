const SellerInventory = require("../models/SellerInventory");
const Banner = require("../models/Banner");
const Deal = require("../models/Deal");

/* =======================================
   1. Latest Products
   GET /api/products/latest
======================================= */
exports.getLatestProducts = async (
  req,
  res,
) => {
  try {
    const products =
      await SellerInventory.find({
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(10);

    res.status(200).json({
      success: true,
      data: products,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   2. Brand Products
   GET /api/products/brand/:brandName
======================================= */
exports.getBrandProducts = async (
  req,
  res,
) => {
  try {
    const { brandName } = req.params;

    const products =
      await SellerInventory.find({
        "brands.name": brandName,
        isActive: true,
      });

    res.status(200).json({
      success: true,
      data: products,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   3. Banner Slider
   GET /api/banners
======================================= */
exports.getBanners = async (
  req,
  res,
) => {
  try {
    const banners =
      await Banner.find({
        isActive: true,
      });

    res.status(200).json({
      success: true,
      data: banners,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   4. Promotions
   GET /api/promotions
======================================= */
exports.getPromotions = async (
  req,
  res,
) => {
  try {
    const promotions =
      await SellerInventory.find({
        isFeatured: true,
        isActive: true,
      }).limit(6);

    res.status(200).json({
      success: true,
      data: promotions,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   5. Top Brands
   GET /api/brands/top
======================================= */


exports.getTopBrands = async (
  req,
  res,
) => {
  try {

    const brands =
      await SellerInventory.aggregate([

        // ACTIVE PRODUCTS ONLY
        {
          $match: {
            isActive: true
          }
        },

        // CONVERT BRANDS ARRAY
        {
          $unwind: "$brands"
        },

        // GROUP BY BRAND NAME
        {
          $group: {

            _id: "$brands.name",

            logo: {
              $first: "$brands.logo"
            },

            totalProducts: {
              $sum: 1
            }

          }
        },

        // SORT DESCENDING
        {
          $sort: {
            totalProducts: -1
          }
        },

        // LIMIT
        {
          $limit: 10
        },

        // FINAL RESPONSE
        {
          $project: {

            _id: 0,

            name: "$_id",

            logo: 1,

            totalProducts: 1

          }
        }

      ]);

    res.status(200).json({
      success: true,
      data: brands
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};
/* =======================================
   6. Deals
   GET /api/deals
======================================= */
exports.getDeals = async (
  req,
  res,
) => {
  try {
    const deals = await Deal.find({
      isActive: true,
    }).populate({
      path: "sellerInventoryId",
      model: "SellerInventory",
    });

    res.status(200).json({
      success: true,
      data: deals,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};