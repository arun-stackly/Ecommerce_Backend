const Banner = require("../models/Banner");
const SellerInventory = require("../models/SellerInventory");
const Category = require("../models/Category");
const mongoose = require("mongoose");

exports.getHomepageData = async (req, res) => {
  try {
    const APPLIANCE_CATEGORY_ID =
  "69367686e9c011d0457e1816";
    // =========================
    // HERO BANNERS
    // =========================

    const heroBanners = await Banner.find({
      type: "homepage",
      isActive: true,
      category: APPLIANCE_CATEGORY_ID,
    });

    // =========================
    // LATEST LAUNCHES
    // =========================

    const latestLaunches = await Banner.find({
      type: "launches",
      isActive: true,
      category: APPLIANCE_CATEGORY_ID,
    });

    // =========================
    // BIG SALE BANNERS
    // =========================

    const offerBanners = await Banner.find({
      type: "offers",
      isActive: true,
      category: APPLIANCE_CATEGORY_ID,
    });


    
    // =========================
    // FEATURED PRODUCTS
    // =========================

    const featuredProducts =
      await SellerInventory.find({
        isFeatured: true,
        isActive: true,
       category: APPLIANCE_CATEGORY_ID,
      })
        .sort({ createdAt: -1 })
        .limit(10);

    // =========================
    // TOP BRANDS
    // =========================

    const brandProducts =
      await SellerInventory.aggregate([
        {
          $match: {
           category:
          new mongoose.Types.ObjectId(
            APPLIANCE_CATEGORY_ID
          ),
          },
        },
        {
          $unwind: "$brands",
        },

        {
          $group: {
            _id: "$brands.name",
            logo: {
              $first: "$brands.logo",
            },
          },
        },

        {
          $limit: 10,
        },
      ]);

    res.status(200).json({
      success: true,

      data: {
        heroBanners,
        latestLaunches,
        offerBanners,
        featuredProducts,
        brandProducts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};