const Product = require("../models/Product");
const Banner = require("../models/Banner");
const Deal = require("../models/Deal");

// =======================================
// 1. Latest Products
// GET /api/products/latest
//Get only active products,   Sort by newest first ,Limit to 10 products
// =======================================
exports.getLatestProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// 2. Brand Products
// GET /api/products/brand/:brandName
// =======================================
exports.getBrandProducts = async (req, res) => {
  try {
    const { brandName } = req.params;

    const products = await Product.find({
      "brands.name": brandName,
      status: "active"
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// 3. Banner Slider
// GET /api/banners
// Get banners for homepage  , Only active banners
// =======================================
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.find({
      isActive: true
    });

    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// 4. Promotions
// GET /api/promotions
// Fetch products marked as featured, Limit to 6
// =======================================
exports.getPromotions = async (req, res) => {
  try {
    const promotions = await Product.find({
      isFeatured: true,
      status: "active"
    }).limit(6);

    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// 5. Top Brands
// GET /api/brands/top
// Popular brands, Brand filter UI
// =======================================
exports.getTopBrands = async (req, res) => {
  try {
    const brands = await Product.aggregate([
  { $match: { status: "active" } },
  { $unwind: "$brands" }, // break array
  {
    $group: {
      _id: "$brands.name",
      logo: { $first: "$brands.logo" },
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 6 },
  {
    $project: {
      _id: 0,
      name: "$_id",
      logo: 1,
      count: 1
    }
  }
]);

    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// =======================================
// 6. Deals
// GET /api/deals
// Get active deals, Attach product details
// =======================================
exports.getDeals = async (req, res) => {
  try {
    const deals = await Deal.find({ isActive: true })
      .populate({
  path: "productId",
  populate: ["category", "subcategory", "subSubcategory"]
});
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};