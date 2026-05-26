const Banner = require("../models/Banner");

// ✅ ADD BANNER
exports.addBanner = async (req, res) => {
  try {

    const {
      title,
      image,
      redirectUrl,
      type,
      category,
    } = req.body;

    const banner = await Banner.create({
      title,
      image,
      redirectUrl,
      category,
      type,
    });

    res.status(201).json({
      success: true,
      message: "Banner added successfully",
      banner,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ✅ GET MONTHLY BANNER
exports.getMonthlyBanner = async (req, res) => {
  try {

    const { categoryId } = req.params;

    const banner = await Banner.findOne({
      category: categoryId,
      type: "monthly",
      isActive: true,
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Monthly banner not found",
      });
    }

    res.status(200).json({
      success: true,
      banner,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ✅ GET ALL BANNERS
exports.getBanners = async (req, res) => {
  try {

    const { type } = req.query;

    const banners = await Banner.find({
      type: type || "homepage",
      isActive: true,
    });

    res.status(200).json({
      success: true,
      banners,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};