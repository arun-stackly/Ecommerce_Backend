const Product = require("../models/Product");
const ProductItem = require("../models/productitem");
const Deal = require("../models/Deal");
const mongoose = require("mongoose");

const menCategoryId = "69b7fe2a038ad2c5821568ee";


// =======================================
// 1. Get All Products
// GET /api/products
// Fetch all products with category details
// =======================================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category")
      .populate("subcategory")
      .populate("subSubcategory");

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// =======================================
// 2. Filter Men Products
// GET /api/men/filter
// Filter by:
// - productType (shirt, jeans, etc.) from ProductItem
// - subSubcategory (Men)
// Returns product details using populate
// =======================================
exports.getMenFilteredProducts = async (req, res) => {
  try {
    const { productType, subSubcategoryId } = req.query;

    let filter = {};

    // Filter by product type
    if (productType) {
      filter.productType = productType;
    }

    // Filter by subSubcategory (Men)
    if (subSubcategoryId) {
      filter.subSubcategory = new mongoose.Types.ObjectId(subSubcategoryId);
    }

    // Fetch filtered ProductItems and populate product details
    const items = await ProductItem.find(filter)
      .populate({
        path: "product",
        populate: ["category", "subcategory", "subSubcategory"]
      });

    res.json({
      success: true,
      count: items.length,
      data: items
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// =======================================
// 3. Upcoming Deals (Men)
// GET /api/men/deals/upcoming
// Get deals where:
// - type = upcoming
// - isActive = true
// Filter only Men category products
// =======================================
exports.getUpcomingDeals = async (req, res) => {
  try {
    const deals = await Deal.find({
      type: "upcoming",
      isActive: true,
    }).populate({
      path: "productId",
      match: { subSubcategory: menCategoryId }, // filter Men products
      populate: ["category", "subcategory", "subSubcategory"]
    });

    // Remove deals where product does not match (null after populate)
    const filteredDeals = deals.filter(deal => deal.productId !== null);

    res.json(filteredDeals);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};


// =======================================
// 4. Top Rated Men Products
// GET /api/men/top-rated
// Logic:
// - Get all Men products
// - Calculate avgRating from reviews
// - Count total reviews
// - Sort by:
//    1. Highest rating
//    2. Highest review count
// - Return top 10 products
// =======================================
exports.getTopRatedMenProducts = async (req, res) => {
  try {
    const products = await Product.find({
      subSubcategory: menCategoryId
    }).populate("category subcategory subSubcategory");

    // Calculate average rating and review count
    const productsWithRating = products.map(product => {
      const totalReviews = product.reviews.length;

      const avgRating =
        totalReviews === 0
          ? 0
          : product.reviews.reduce((acc, r) => acc + r.rating, 0) /
            totalReviews;

      return {
        ...product.toObject(),
        avgRating,
        reviewCount: totalReviews
      };
    });

    // Sort by rating first, then review count
    productsWithRating.sort((a, b) => {
      if (b.avgRating === a.avgRating) {
        return b.reviewCount - a.reviewCount;
      }
      return b.avgRating - a.avgRating;
    });

    res.json({
      success: true,
      products: productsWithRating.slice(0, 10)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// 5. Men Brands
// GET /api/men/brands
// Logic:
// - Get only Men category products
// - Extract brands array
// - Group unique brands
// - Return name + logo
// =======================================
exports.getMenBrands = async (req, res) => {
  try {
    const brands = await Product.aggregate([
      {
        $match: {
          subSubcategory: new mongoose.Types.ObjectId(menCategoryId)
        }
      },
      { $unwind: "$brands" }, // convert array into separate docs
      {
        $group: {
          _id: "$brands.name",
          logo: { $first: "$brands.logo" }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          logo: 1
        }
      }
    ]);

    res.json({ success: true, brands });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// =======================================
// 6. Get All Men Products
// GET /api/men/products
// Fetch all products where subSubcategory = Men
// =======================================
exports.getMenProducts = async (req, res) => {
  try {
    const products = await Product.find({
      subSubcategory: new mongoose.Types.ObjectId(menCategoryId)
    })
      .populate("category subcategory subSubcategory");

    res.json({
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