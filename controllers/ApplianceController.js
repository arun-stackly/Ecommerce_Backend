const mongoose = require("mongoose");

const Banner = require("../models/Banner");

const SellerInventory =
  require("../models/SellerInventory");

/* =====================================================
   GET BANNERS BY SUBCATEGORY
===================================================== */

exports.getBannersBySubcategory =
  async (req, res) => {

    try {

      const { subcategoryId } =
        req.params;

      const banners =
        await Banner.find({
          subcategory:
            subcategoryId,

          isActive: true,
        });

      res.status(200).json({
        success: true,
        count: banners.length,
        banners,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
};

/* =====================================================
   GET TOP RATED PRODUCTS
   BY SUBCATEGORY
===================================================== */

exports.getTopRatedProducts =
  async (req, res) => {

    try {

      const { subcategoryId } =
        req.params;

      const products =
        await SellerInventory.find({
          subcategory:
            subcategoryId,

          isActive: true,
        })

          .select(
            "_id seller name description category subcategory subSubcategory media price"
          )

          .sort({
            averageRating: -1,
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

/* =====================================================
   GET TOP BRANDS BY CATEGORY
===================================================== */

exports.getTopBrandsByCategory =
  async (req, res) => {

    try {

      const { categoryId } =
        req.params;

      const brands =
        await SellerInventory.aggregate([
          {
            $match: {
              category:
                new mongoose.Types.ObjectId(
                  categoryId
                ),

              isActive: true,
            },
          },

          {
            $unwind: "$brands",
          },

          {
            $group: {

              _id: "$brands.name",

              logo: {
                $first:
                  "$brands.logo",
              },

              totalProducts: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              totalProducts: -1,
            },
          },

          {
            $limit: 10,
          },
        ]);

      res.status(200).json({
        success: true,
        brands,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
};