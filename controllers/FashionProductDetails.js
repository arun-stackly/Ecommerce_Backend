const Product = require("../models/Product");
const Deal = require("../models/Deal");
const mongoose = require("mongoose");


// GET /api/products/:id/similar
exports.getSimilarProducts = async (req, res) => {
  try {
    const productId = req.params.id;

    const currentProduct = await Product.findById(productId);

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const similarProducts = await Product.find({
      _id: { $ne: productId },
      subcategory: currentProduct.subcategory
    }).limit(10);

    res.json({
      success: true,
      products: similarProducts
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getProductReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .select("reviews rating reviewCount");

    // ✅ Check first
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;

    const start = (page - 1) * limit;
    const end = start + limit;

    const paginatedReviews = product.reviews.slice(start, end);

    res.json({
      success: true,
      reviews: paginatedReviews, // ✅ FIXED
      rating: product.rating,
      reviewCount: product.reviewCount,
      currentPage: page,
      totalPages: Math.ceil(product.reviewCount / limit)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/search?q=shirt
exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q;

    const products = await Product.find({
      name: { $regex: q, $options: "i" }
    });

    res.json({
      success: true,
      products
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// GET /api/deals
exports.getAllDeals = async (req, res) => {
  try {
    const deals = await Deal.find({ isActive: true })
      .populate("productId");

    res.json({
      success: true,
      deals
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// get single product
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category subcategory subSubcategory");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//POST /api/products/:id/review
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const review = {
      user: req.user._id,
      name: `${req.user.firstName} ${req.user.lastName}`,
      rating,
      comment
    };

    // 👉 Calculate new values manually
    const newReviewCount = product.reviewCount + 1;

    const totalRating =
      product.reviews.reduce((acc, item) => acc + item.rating, 0) + rating;

    const newRating = totalRating / newReviewCount;

    // ✅ Update WITHOUT triggering full validation
    await Product.findByIdAndUpdate(
      req.params.id,
      {
        $push: { reviews: review },
        $set: {
          reviewCount: newReviewCount,
          rating: newRating
        }
      },
      { new: true, runValidators: false } // 👈 IMPORTANT
    );

    res.status(201).json({
      success: true,
      message: "Review added"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//GET /api/products/:id/stock
exports.getProductStock = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("sizes");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      success: true,
      sizes: product.sizes.map(s => ({
        size: s.size,
        available: s.quantity > 0
      }))
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};