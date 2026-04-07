const Product = require("../models/Product");
const ProductItem = require("../models/productitem");
const Deal = require("../models/Deal");
const mongoose = require("mongoose");

// =======================================
// 1. Get All Products
// =======================================
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category subcategory ");

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// 2. Get Products By Category (Women/Men/Kids)
// GET /api/category/:producttypeId/products
// =======================================
exports.getCategoryProducts = async (req, res) => {
  try {
    const { producttypeId } = req.params;

    const products = await Product.find({
      subcategory: new mongoose.Types.ObjectId(producttypeId)
    }).populate("category subcategory");

    res.json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================================
// 3. Filter Products
// GET /api/category/:producttypeId/filter
// =======================================
exports.getFilteredProducts = async (req, res) => {
  try {
    const { producttypeId } = req.params;
    const { productType } = req.query;

    let filter = {};

    if (productType) {
      filter.productType = productType;
    }

    const items = await ProductItem.find(filter).populate({
      path: "product",
      match: {
        subcategory: new mongoose.Types.ObjectId(producttypeId)
      },
      populate: ["category", "subcategory"]
    });

    const filteredItems = items.filter(item => item.product !== null);

    res.json({
      success: true,
      count: filteredItems.length,
      data: filteredItems
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// 4. Upcoming Deals
// GET /api/category/:producttypeId/deals/upcoming
// =======================================
exports.getUpcomingDeals = async (req, res) => {
  try {
    const { producttypeId } = req.params;

    const deals = await Deal.find({
      type: "upcoming",
      isActive: true
    }).populate({
      path: "productId",
      match: {
        subcategory: new mongoose.Types.ObjectId(producttypeId)
      },
      populate: ["category", "subcategory"]
    });

    const filteredDeals = deals.filter(deal => deal.productId !== null);

    res.json({
      success: true,
      deals: filteredDeals
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================================
// 5. Top Rated Products
// GET /api/category/:producttypeId/top-rated
// =======================================
exports.getTopRatedProducts = async (req, res) => {
  try {
    const { producttypeId } = req.params;

    const products = await Product.find({
      subcategory: new mongoose.Types.ObjectId(producttypeId)
    });

    const productsWithRating = products.map(product => {
      const totalReviews = product.reviews?.length || 0;

      const avgRating =
        totalReviews === 0
          ? 0
          : product.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

      return {
        ...product.toObject(),
        avgRating,
        reviewCount: totalReviews
      };
    });

    productsWithRating.sort((a, b) => b.avgRating - a.avgRating);

    res.json({
      success: true,
      products: productsWithRating.slice(0, 10)
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryBrands = async (req, res) => {
  try {
    const { producttypeId } = req.params;

    const brands = await Product.aggregate([
      {
        $match: {
          subcategory: new mongoose.Types.ObjectId(producttypeId)
        }
      },
      { $unwind: "$brands" },
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
    res.status(500).json({ message: error.message });
  }
};