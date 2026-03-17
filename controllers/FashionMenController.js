const Product = require("../models/Product");
const ProductItem = require("../models/productitem");
const Deal = require("../models/Deal");
exports.getProducts = async (req, res) => {

  try {

    const products = await Product.find()
      .populate("category")
      .populate("subcategory")
      s

    res.json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
exports.getProductsByTypeAndSubSubCategory = async (req, res) => {
  try {

    const { productType, subSubcategoryId } = req.query;

    let filter = {};

    if (productType) filter.productType = productType;
    if (subSubcategoryId) filter.subSubcategory = subSubcategoryId;

    const products = await Product.find(filter)
      .populate("category subcategory subSubcategory");

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// ✅ Upcoming Deals
exports.getUpcomingDeals = async (req, res) => {
  try {
    

    const deals = await Deal.find({
      type: "upcoming",
      isActive: true,
    }).populate({
      path: "productId",
      match: { subSubcategory: menCategoryId }, // 🔥 filter here
      populate: ["category", "subcategory", "subSubcategory"]
    });

    // ❗ Remove null products (non-men deals)
    const filteredDeals = deals.filter(deal => deal.productId !== null);

    res.json(filteredDeals);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
const menCategoryId = "69b7fe2a038ad2c5821568ee";

// ✅ Top Rated
exports.getTopRatedMenProducts = async (req, res) => {
  try {
    const items = await ProductItem.find()
      .populate({
        path: "product",
        match: { category: menCategoryId }
      })
      .sort({ rating: -1 })
      .limit(10);

    const filtered = items.filter(item => item.product !== null);

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Brands
exports.getMenBrands = async (req, res) => {
  try {
    const brands = await Product.distinct("brands", {
      subSubcategory: menCategoryId
    });

    res.json({ success: true, brands });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
