const SellerInventory = require("../models/SellerInventory");
const Deal = require("../models/Deal");
const mongoose = require("mongoose");
const ProductItem = require("../models/productitem");

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
   GET /api/category/:productTypeId/products
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
   GET /api/category/:productTypeId/filter
======================================= */
exports.getFilteredProducts =
  async (req, res) => {
    try {

      const { productTypeId } =
        req.params;

      const {
        minPrice,
        maxPrice,
        brand,
        productType,
      } = req.query;

      // PRODUCT ITEM FILTER
      let productItemFilter = {

        productType:
  new mongoose.Types.ObjectId(productTypeId)
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
   GET /api/category/:productTypeId/deals/upcoming
======================================= */
exports.getUpcomingDeals = async (req, res) => {
  try {
    const { productTypeId } = req.params;

    const deals = await Deal.find({
      type: "upcoming",
      isActive: true,
    }).populate({
      path: "productItem",
      match: {
        productType:
          new mongoose.Types.ObjectId(productTypeId),
      },
    });

     const filteredDeals =
      deals.filter(
        deal =>
          deal.productItem &&
          deal.productItem.sellerInventory
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
   TOP RATED PRODUCTS
   GET /api/fashions/category/:productTypeId/top-rated
======================================= */

exports.getTopRatedProducts =
  async (req, res) => {

    try {

      const { productTypeId } =
        req.params;

      /* =========================
         GET PRODUCT ITEMS
      ========================= */

      const productItems =
        await ProductItem.find({

          productType:
            new mongoose.Types.ObjectId(
              productTypeId
            ),

        }).populate({

          path: "sellerInventory",

          match: {
            isActive: true,
          },

        });

      /* =========================
         EXTRACT PRODUCTS
      ========================= */

      const products =
        productItems

          .filter(
            item =>
              item.sellerInventory
          )

          .map(
            item =>
              item.sellerInventory
          );

      /* =========================
         CALCULATE RATINGS
      ========================= */

      const productsWithRating =

        products

          .map((product) => {

            const totalReviews =
              product.reviews?.length || 0;

            const avgRating =

              totalReviews === 0

                ? 0

                : product.reviews.reduce(

                    (acc, review) =>

                      acc + review.rating,

                    0

                  ) / totalReviews;

            return {

              ...product.toObject(),

              avgRating:
                Number(
                  avgRating.toFixed(1)
                ),

              reviewCount:
                totalReviews,

            };

          })

          // REMOVE PRODUCTS
          // WITHOUT REVIEWS
          .filter(
            p => p.reviewCount > 0
          )

          // HIGH TO LOW
          .sort(
            (a, b) =>

              b.avgRating -
              a.avgRating
          )

          // TOP 10
          .slice(0, 10);

      /* =========================
         RESPONSE
      ========================= */

      res.status(200).json({

        success: true,

        count:
          productsWithRating.length,

        products:
          productsWithRating,

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

      const { productTypeId } =
        req.params;

      // GET PRODUCT ITEMS
      const productItems =
        await ProductItem.find({

          productType:
            new mongoose.Types.ObjectId(
              productTypeId
            )

        }).populate({

          path: "sellerInventory",

          match: {
            isActive: true
          }

        });

      // EXTRACT PRODUCTS
      const products =
        productItems

          .filter(
            item =>
              item.sellerInventory
          )

          .map(
            item =>
              item.sellerInventory
          );

      // EXTRACT BRANDS
      const brandsMap = {};

      products.forEach(product => {

        product.brands?.forEach(brand => {

          if (!brandsMap[brand.name]) {

            brandsMap[brand.name] = {

              name: brand.name,

              logo: brand.logo,

              count: 1

            };

          } else {

            brandsMap[brand.name]
              .count += 1;

          }

        });

      });

      const brands =
        Object.values(brandsMap);

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