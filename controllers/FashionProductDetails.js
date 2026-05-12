const SellerInventory = require("../models/SellerInventory");
const Deal = require("../models/Deal");
const mongoose = require("mongoose");

/* =========================================
   GET SIMILAR PRODUCTS
   GET /api/products/:id/similar
========================================= */
exports.getSimilarProducts = async (
  req,
  res,
) => {
  try {
    const inventoryId = req.params.id;

    const currentProduct =
      await SellerInventory.findById(
        inventoryId,
      );

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const similarProducts =
      await SellerInventory.find({
        _id: {
          $ne: inventoryId,
        },

        category:
          currentProduct.category,

        isActive: true,
      }).limit(10);

    res.status(200).json({
      success: true,
      products: similarProducts,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET PRODUCT REVIEWS
   GET /api/products/:id/reviews
========================================= */
exports.getProductReviews = async (
  req,
  res,
) => {
  try {
    const inventory =
      await SellerInventory.findById(
        req.params.id,
      ).select(
        "reviews rating reviewCount",
      );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 5;

    const start = (page - 1) * limit;

    const end = start + limit;

    const paginatedReviews =
      inventory.reviews.slice(start, end);

    res.status(200).json({
      success: true,

      reviews: paginatedReviews,

      rating: inventory.rating,

      reviewCount:
        inventory.reviewCount,

      currentPage: page,

      totalPages: Math.ceil(
        inventory.reviewCount / limit,
      ),
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   SEARCH PRODUCTS
   GET /api/products/search?q=shirt
========================================= */
exports.searchProducts = async (
  req,
  res,
) => {
  try {
    const q = req.query.q;

    const products =
      await SellerInventory.find({
        name: {
          $regex: q,
          $options: "i",
        },

        isActive: true,
      });

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

/* =========================================
   GET ALL DEALS
   GET /api/deals
========================================= */
exports.getAllDeals = async (
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
      deals,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET SINGLE PRODUCT
   GET /api/products/:id
========================================= */
exports.getProductById = async (
  req,
  res,
) => {
  try {
    const product =
      await SellerInventory.findById(
        req.params.id,
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
   ADD REVIEW
   POST /api/products/:id/review
========================================= */
exports.addReview = async (
  req,
  res,
) => {
  try {
    const { rating, comment } =
      req.body;

    const inventory =
      await SellerInventory.findById(
        req.params.id,
      );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const review = {
      user: req.user._id,

      name: `${req.user.firstName} ${req.user.lastName}`,

      rating,

      comment,
    };

    const newReviewCount =
      (inventory.reviewCount || 0) + 1;

    const totalRating =
      (inventory.reviews || []).reduce(
        (acc, item) =>
          acc + item.rating,
        0,
      ) + rating;

    const newRating =
      totalRating / newReviewCount;

    await SellerInventory.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          reviews: review,
        },

        $set: {
          reviewCount:
            newReviewCount,

          rating: newRating,
        },
      },
      {
        new: true,
        runValidators: false,
      },
    );

    res.status(201).json({
      success: true,
      message: "Review added",
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
exports.getProductStock = async (
  req,
  res,
) => {
  try {
    const inventory =
      await SellerInventory.findById(
        req.params.id,
      ).select(
        "quantity isActive",
      );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,

      stock: {
        quantity:
          inventory.quantity,

        available:
          inventory.quantity > 0 &&
          inventory.isActive,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};