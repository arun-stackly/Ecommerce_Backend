const SellerInventory =
  require("../models/SellerInventory");

const Deal =
  require("../models/Deal");

const mongoose =
  require("mongoose");

const ProductItem =
  require("../models/productitem");

/* =========================================
   GET PRODUCT DETAILS
   GET /api/products/:id
========================================= */

exports.getProductById = async (
  req,
  res,
) => {

  try {

    const product =
      await SellerInventory.findById(
        req.params.id
      )

      .select(`
        name
        description
        price
        quantity
        media
        brands
        sizes
        colours
        rating
        reviewCount
        reviews
        countryOfOrigin
        seller
        isFeatured
      `)

      .populate(
        "seller",
        "name email"
      );

    if (!product) {

      return res.status(404).json({

        success: false,
        message: "Product not found",

      });

    }

    res.status(200).json({

      success: true,
      product,

    });

  } catch (error) {

    res.status(500).json({

      success: false,
      message: error.message,

    });

  }

};

/* =========================================
   GET PRODUCT STOCK
   GET /api/products/:id/stock
========================================= */

exports.getProductStock =
  async (req, res) => {

    try {

      const inventory =
        await SellerInventory.findById(
          req.params.id
        ).select(
          "quantity isActive"
        );

      if (!inventory) {

        return res.status(404).json({

          success: false,
          message: "Product not found"

        });

      }

      res.status(200).json({

        success: true,

        stock: {

          quantity:
            inventory.quantity,

          available:
            inventory.quantity > 0 &&
            inventory.isActive

        }

      });

    } catch (error) {

      res.status(500).json({

        success: false,
        message: error.message

      });

    }

  };

/* =========================================
   GET PRODUCT REVIEWS
   GET /api/products/:id/reviews
========================================= */

exports.getProductReviews =
  async (req, res) => {

    try {

      const product =
        await SellerInventory.findById(
          req.params.id
        ).select(
          "reviews rating reviewCount"
        );

      if (!product) {

        return res.status(404).json({

          success: false,
          message: "Product not found"

        });

      }

      res.status(200).json({

        success: true,

        rating: product.rating,

        reviewCount:
          product.reviewCount,

        reviews:
          product.reviews,

      });

    } catch (error) {

      res.status(500).json({

        success: false,
        message: error.message

      });

    }

  };
/* =========================================
   GET SIMILAR PRODUCTS
========================================= */

exports.getSimilarProducts =
  async (req, res) => {

    try {

      const {
        productType
      } = req.query;

      const productItems =
        await ProductItem.find({

          productType

        }).populate({

          path: "sellerInventory",

          match: {

            _id: {
              $ne: req.params.id
            },

            isActive: true

          },

          select:
            "name description price rating media"

        });

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

      res.status(200).json({

        success: true,

        count: products.length,

        products

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  };

/* =========================================
   RECENTLY VIEWED PRODUCTS
========================================= */

exports.getRecentlyViewed =
  async (req, res) => {

    try {

      const products =
        await SellerInventory.find({

          isActive: true

        })

        .select(
          "name description price rating media"
        )

        .sort({
          updatedAt: -1
        })

        .limit(10);

      res.status(200).json({

        success: true,

        products

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  };

/* =========================================
   ACCESSORIES PRODUCTS
========================================= */

exports.getAccessoriesProducts =
  async (req, res) => {

    try {

      const product =
        await SellerInventory.findById(
          req.params.id
        );

      const accessories =
        await SellerInventory.find({

          category:
            product.category,

          _id: {
            $ne: product._id
          },

          isActive: true

        })

        .select(
          "name description price rating media"
        )

        .limit(10);

      res.status(200).json({

        success: true,

        accessories

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  };

/* =========================================
   RECOMMENDED PRODUCTS
========================================= */

exports.getRecommendedProducts =
  async (req, res) => {

    try {

      const product =
        await SellerInventory.findById(
          req.params.id
        );

      const products =
        await SellerInventory.find({

          category:
            product.category,

          isActive: true,

          _id: {
            $ne: product._id
          }

        })

        .select(
          "name description price rating media"
        )

        .limit(10);

      res.status(200).json({

        success: true,

        products

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  };
  /* =========================================
   BEST SELLERS
========================================= */

exports.getBestSellers =
  async (req, res) => {

    try {

      const products =
        await SellerInventory.find({

          category:
            req.params.categoryId,

          isActive: true

        })

        .select(
          "name description price rating media soldCount"
        )

        .sort({
          soldCount: -1
        })

        .limit(10);

      res.status(200).json({

        success: true,

        count: products.length,

        products

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  };