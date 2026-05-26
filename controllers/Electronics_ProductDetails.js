// controllers/productDetails.controller.js

const SellerInventory =
  require("../models/SellerInventory");

const ProductItem =
  require("../models/ProductItem");

const Review =
  require("../models/Review");

const Deal =
  require("../models/Deal");

/* =========================================
   GET PRODUCT DETAILS
========================================= */

exports.getProductDetails =
  async (req, res) => {

    try {

      const product =
        await SellerInventory.findById(
          req.params.id
        )

        .populate("category", "name")

        .populate("subcategory", "name")

        .populate("subSubcategory", "name")

        .populate("seller", "name email");

      if (!product) {

        return res.status(404).json({

          success: false,
          message: "Product not found"

        });

      }

      product.views += 1;

      await product.save();

      res.status(200).json({

        success: true,
        product

      });

    } catch (error) {

      res.status(500).json({

        success: false,
        message: error.message

      });

    }

  };

/* =========================================
   GET PRODUCT STOCK
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

          }

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
   SEARCH PRODUCTS
========================================= */

exports.searchProducts =
  async (req, res) => {

    try {

      const q = req.query.q;

      const products =
        await SellerInventory.find({

          name: {

            $regex: q,

            $options: "i"

          },

          isActive: true

        });

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
   GET DEALS
========================================= */

exports.getAllDeals =
  async (req, res) => {

    try {

      const deals =
        await Deal.find({

          isActive: true

        }).populate({

          path: "productItem"

        });

      res.status(200).json({

        success: true,

        deals

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
========================================= */

exports.getProductReviews =
  async (req, res) => {

    try {

      const reviews =
        await Review.find({

          product:
            req.params.id

        }).populate(
          "user",
          "name"
        );

      res.status(200).json({

        success: true,

        count:
          reviews.length,

        reviews

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message

      });

    }

  };

/* =========================================
   ADD REVIEW
========================================= */

exports.addReview =
  async (req, res) => {

    try {

      const review =
        await Review.create({

          product:
            req.params.id,

          ...req.body

        });

      res.status(201).json({

        success: true,

        review

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

        }).limit(10);

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

        .sort({
          soldCount: -1
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