const SellerInventory = require("../models/SellerInventory");
const Banner = require("../models/Banner");


// ======================================================
// CATEGORY HOME PAGE CONTROLLER
// API: GET /api/home/:categoryId
// ======================================================

exports.getHomePageData = async (req, res) => {
  try {

   // =========================================
      // HARDCODE CATEGORY ID
      // =========================================
      const categoryId =
        "6a0422c0936b09c6f7cd3519";

    // =========================================
    // Homepage Banner
    // =========================================
    const banner = await Banner.findOne({
      type: "homepage",
      isActive: true,
    });

    // =========================================
    // Latest Launches
    // =========================================
    const latestLaunches =
      await SellerInventory.find({
        category: categoryId,
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(10);

    // =========================================
    // Top Deal
    // =========================================
    const topDeal =
      await SellerInventory.findOne({
        category: categoryId,
        isFeatured: true,
        isActive: true,
      })
        .sort({ views: -1 });

    // =========================================
    // Sale Of The Day
    // =========================================
    const currentDate = new Date();

    const saleOfDay =
      await SellerInventory.find({
        category: categoryId,

        isActive: true,

        isSaleOfDay: true,

        saleStartDate: {
          $lte: currentDate,
        },

        saleEndDate: {
          $gte: currentDate,
        },
      })
        .sort({ createdAt: -1 })
        .limit(10);

    // =========================================
    // Best Sellers
    // =========================================
    const bestSellers =
      await SellerInventory.find({
        category: categoryId,
        isActive: true,
      })
        .sort({
          reviewCount: -1,
          views: -1,
        })
        .limit(10);

    // =========================================
    // Upcoming Deals
    // =========================================
    const upcomingDeals =
      await SellerInventory.find({
        category: categoryId,
        isFeatured: true,
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .limit(10);

    // =========================================
    // Samsung Deals
    // =========================================
    const samsungDeals =
      await SellerInventory.find({
        category: categoryId,
        "brands.name": "Samsung",
        isActive: true,
      }).limit(10);

    // =========================================
    // Oppo Deals
    // =========================================
    const oppoDeals =
      await SellerInventory.find({
        category: categoryId,
        "brands.name": "Oppo",
        isActive: true,
      }).limit(10);

    // =========================================
    // Vivo Deals
    // =========================================
    const vivoDeals =
      await SellerInventory.find({
        category: categoryId,
        "brands.name": "Vivo",
        isActive: true,
      }).limit(10);

    // =========================================
    // Apple Deals
    // =========================================
    const appleDeals =
      await SellerInventory.find({
        category: categoryId,
        "brands.name": "Apple",
        isActive: true,
      }).limit(10);

    // =========================================
    // Response
    // =========================================
    res.status(200).json({
      success: true,

      banner,

      latestLaunches,

      topDeal,

      saleOfDay,

      bestSellers,

      upcomingDeals,

      brandDeals: {
        apple: appleDeals,
        samsung: samsungDeals,
        oppo: oppoDeals,
        vivo: vivoDeals,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};