const Banner = require("../models/Banner");

// ===============================
// ADD BANNER
// ===============================
exports.addBanner = async (req, res) => {
  try {
    const {
      title,
      image,
      redirectUrl,
      type,
      position,
      category,
      subcategory,
      subSubcategory,
      productType,
      isActive,
      priority,
      startDate,
      endDate,
    } = req.body;

    // Required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Banner title is required",
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    // Create banner
    const banner = await Banner.create({
      title: title.trim(),

      image,

      redirectUrl: redirectUrl || "",

      type: type || "homepage",

      position: position || "hero",

      category: category || null,

      subcategory: subcategory || null,

      subSubcategory: subSubcategory || null,

      productType: productType || null,

      isActive:
        isActive === undefined
          ? true
          : isActive === true ||
            isActive === "true",

      priority: priority || 1,

      startDate: startDate || null,

      endDate: endDate || null,
    });

    return res.status(201).json({
      success: true,
      message: "Banner added successfully",
      banner,
    });

  } catch (error) {
    console.error("Add Banner Error:", error);

    return res.status(500).json({
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
// ✅ GET BANNERS BY CATEGORY ID
exports.getBannersByCategory = async (req, res) => {
  try {

    const { categoryId } = req.params;

    const banners = await Banner.find({
      category: categoryId,
      isActive: true,
    });

    if (!banners.length) {
      return res.status(404).json({
        success: false,
        message: "No banners found for this category",
      });
    }

    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ✅ GET BANNERS BY PRODUCT TYPE ID
exports.getBannersByProductType = async (req, res) => {
  try {

    const { productTypeId } = req.params;

    const banners = await Banner.find({
      productType: productTypeId,
      isActive: true,
    });

    if (!banners.length) {
      return res.status(404).json({
        success: false,
        message: "No banners found for this product type",
      });
    }

    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// ✅ GET BANNERS BY SUBCATEGORY ID
exports.getBannersBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    const banners = await Banner.find({
      subcategory: subcategoryId,
      isActive: true,
    });

    if (!banners.length) {
      return res.status(404).json({
        success: false,
        message: "No banners found for this subcategory",
      });
    }

    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ✅ GET BANNERS BY SUB-SUBCATEGORY ID
exports.getBannersBySubSubcategory = async (req, res) => {
  try {
    const { subSubcategoryId } = req.params;

    const banners = await Banner.find({
      subSubcategory: subSubcategoryId,
      isActive: true,
    });

    if (!banners.length) {
      return res.status(404).json({
        success: false,
        message: "No banners found for this sub-subcategory",
      });
    }

    res.status(200).json({
      success: true,
      count: banners.length,
      banners,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      banner,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
