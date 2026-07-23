const Banner = require("../models/Banner");
const TravelPackage = require("../models/Travelpackage");
const Category = require("../models/Category");
const Ad = require("../models/Ad");
const mongoose = require("mongoose");
const Subcategory = require("../models/Subcategory");

exports.getHomePage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // =========================================
    // Hero Banner
    // =========================================
    const heroBanner = await Banner.findOne({
      category: categoryId,
      type: "Travel Homepage",
      isActive: true,
    });

    // =========================================
// Browse Travel Categories
// =========================================
const categories = await Subcategory.find({
  category: categoryId,
}).select("name slug")

    // =========================================
    // Latest Launches
    // =========================================
    const latestLaunches = await TravelPackage.find({
      category: categoryId,
      isLatest: true,
      isActive: true,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .sort({ createdAt: -1 })
      .limit(6);

    // =========================================
    // Advertisement Banner
    // =========================================
    const adBanner = await Ad.findOne({
      category: categoryId,
      isActive: true,
    })
      .populate("product", "name media")
      .sort({ createdAt: -1 });

    // =========================================
    // Top Brands
    // =========================================
  const topBrands = await TravelPackage.aggregate([
  {
    $match: {
      category: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
    },
  },
  {
    $group: {
      _id: "$brand.name",
      logo: { $first: "$brand.logo" },
    },
  },
  {
    $project: {
      _id: 0,
      name: "$_id",
      logo: 1,
    },
  },
]);

    // =========================================
    // Response
    // =========================================
    res.status(200).json({
      success: true,
      heroBanner,
      categories,
      latestLaunches,
      adBanner,
      topBrands,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};