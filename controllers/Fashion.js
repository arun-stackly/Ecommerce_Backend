const SellerInventory = require("../models/SellerInventory");
const Deal = require("../models/Deal");
const mongoose = require("mongoose");
const ProductItem = require("../models/ProductItem");

/* =======================================
   1. Get All Products
======================================= */
exports.getProducts = async (
  req,
  res,
) => {
  try {
    const products =
      await SellerInventory.find({
        isActive: true,
      }).populate(
        "category subcategory",
      );

    res.status(200).json({
      success: true,
      products,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   2. Get Products By Category
   GET /api/category/:producttypeId/products
======================================= */
exports.getCategoryProducts =
  async (req, res) => {
    try {

      const { categoryId } =
        req.params;

      const products =
        await SellerInventory.find({

          category:
            new mongoose.Types.ObjectId(
              categoryId
            ),

          isActive: true,

        }).populate(
          "category subcategory"
        );

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
/* =======================================
   3. Filter Products
   GET /api/category/:producttypeId/filter
======================================= */
exports.getFilteredProducts =
  async (req, res) => {
    try {

      const { producttypeId } =
        req.params;

      const {
        minPrice,
        maxPrice,
        brand,
        productType,
      } = req.query;

      // PRODUCT ITEM FILTER
      let productItemFilter = {

        subcategory:
          new mongoose.Types.ObjectId(
            producttypeId
          ),

      };

      // PRODUCT TYPE FILTER
      if (productType) {

        productItemFilter.productType =
          productType;

      }

      // GET PRODUCT ITEMS
      const productItems =
        await ProductItem.find(
          productItemFilter
        ).populate({

          path: "sellerInventory",

          match: {

            isActive: true,

          },

        });

      // REMOVE NULL PRODUCTS
      let products =
        productItems
          .filter(
            item =>
              item.sellerInventory
          )
          .map(
            item =>
              item.sellerInventory
          );

      // PRICE FILTER
      if (minPrice) {

        products = products.filter(
          p =>
            p.price >=
            Number(minPrice)
        );

      }

      if (maxPrice) {

        products = products.filter(
          p =>
            p.price <=
            Number(maxPrice)
        );

      }

      // BRAND FILTER
      if (brand) {

        products = products.filter(
          p =>
            p.brands.some(
              b =>
                b.name === brand
            )
        );

      }

      res.status(200).json({

        success: true,

        count: products.length,

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
   4. Upcoming Deals
   GET /api/category/:producttypeId/deals/upcoming
======================================= */
exports.getUpcomingDeals = async (req, res) => {
  try {
    const { producttypeId } = req.params;

    const deals = await Deal.find({
      type: "upcoming",
      isActive: true,
    }).populate({
      path: "productId",
      match: {
        subcategory: new mongoose.Types.ObjectId(producttypeId),
        isActive: true,
      },
    });

    const filteredDeals = deals.filter(
      (deal) => deal.productId !== null
    );

    res.status(200).json({
      success: true,
      deals: filteredDeals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   5. Top Rated Products
   GET /api/category/:producttypeId/top-rated
======================================= */
exports.getTopRatedProducts = async (req, res) => {
  try {
    const { producttypeId } = req.params;

    const products = await SellerInventory.find({
      subcategory: new mongoose.Types.ObjectId(producttypeId),
      isActive: true,
    });

    const productsWithRating = products
      .map((product) => {
        const totalReviews = product.reviews?.length || 0;

        const avgRating =
          totalReviews === 0
            ? 0
            : product.reviews.reduce(
                (acc, r) => acc + r.rating,
                0
              ) / totalReviews;

        return {
          ...product.toObject(),
          avgRating,
          reviewCount: totalReviews,
        };
      })
      .filter((p) => p.reviewCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      products: productsWithRating,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =======================================
   6. Category Brands
======================================= */
exports.getCategoryBrands =
  async (req, res) => {
    try {

      const { producttypeId } =
        req.params;

      const brands =
        await SellerInventory.aggregate([

          {
            $match: {

              subcategory:
                new mongoose.Types.ObjectId(
                  producttypeId
                ),

              isActive: true,
            },
          },

          // CONVERT BRANDS ARRAY
          {
            $unwind: "$brands",
          },

          // GROUP BY BRAND NAME
          {
            $group: {

              _id: "$brands.name",

              logo: {
                $first:
                  "$brands.logo",
              },

              count: {
                $sum: 1,
              },
            },
          },

          {
            $project: {

              _id: 0,

              name: "$_id",

              logo: 1,

              count: 1,
            },
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