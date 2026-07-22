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
exports.getBannersByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const banners = await Banner.find({
      category: categoryId,
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

exports.getBannersBySubSubCategory = async (req, res) => {
  try {
    const { subSubCategoryId } = req.params;

   const banners = await Banner.find({
  subSubcategory: subSubCategoryId,
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

exports.getTopRatedProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    const products = await SellerInventory.aggregate([
      {
        $match: {
          subcategory: new mongoose.Types.ObjectId(subcategoryId),
          isActive: true,
        },
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.rating" },
              0,
            ],
          },
        },
      },
      {
  $match: {
    reviewCount: { $gt: 0 }
  }
},
      {
        $sort: {
          averageRating: -1,
          reviewCount: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          seller: 1,
          name: 1,
          description: 1,
          category: 1,
          subcategory: 1,
          subSubcategory: 1,
          media: 1,
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);

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
   GET TOP RATED PRODUCTS
   BY CATEGORY
===================================================== */

exports.getTopRatedProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await SellerInventory.aggregate([
      {
        $match: {
          category: new mongoose.Types.ObjectId(categoryId),
          isActive: true,
        },
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.rating" },
              0,
            ],
          },
        },
      },
      {
  $match: {
    reviewCount: { $gt: 0 }
  }
},
      {
        $sort: {
          averageRating: -1,
          reviewCount: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          seller: 1,
          name: 1,
          description: 1,
          category: 1,
          media: 1,
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);

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
   GET TOP RATED PRODUCTS
   BY SUB SUB CATEGORY
===================================================== */

exports.getTopRatedProductsBySubSubCategory = async (req, res) => {
  try {
    const { subSubCategoryId } = req.params;

    const products = await SellerInventory.aggregate([
      {
        $match: {
          subSubcategory: new mongoose.Types.ObjectId(subSubCategoryId),
          isActive: true,
        },
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          averageRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.rating" },
              0,
            ],
          },
        },
      },
      {
  $match: {
    reviewCount: { $gt: 0 }
  }
},
      {
        $sort: {
          averageRating: -1,
          reviewCount: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          seller: 1,
          name: 1,
          description: 1,
          category: 1,
          subcategory: 1,
          subSubcategory: 1,
          media: 1,
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);

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