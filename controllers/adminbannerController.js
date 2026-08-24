const Banner = require("../models/Banner");

// ==========================================
// GET ADMIN BANNER STATS
// ==========================================
exports.getAdminBannerStats = async (req, res) => {
  try {
    // Total banners
    const totalBanners = await Banner.countDocuments();

    // Active banners
    const activeBanners = await Banner.countDocuments({
      isActive: true,
    });

    // Homepage hero banners
    const homeHero = await Banner.countDocuments({
      type: "homepage",
      position: "hero",
    });

    // Banners mapped to a category
    const categoryMapped = await Banner.countDocuments({
      category: {
        $exists: true,
        $ne: null,
      },
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalBanners,
        activeBanners,
        homeHero,
        categoryMapped,
      },
    });

  } catch (error) {
    console.error("Get Admin Banner Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
