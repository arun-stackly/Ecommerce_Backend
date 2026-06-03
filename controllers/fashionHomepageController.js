const Banner = require("../models/Banner");
const SellerInventory = require("../models/SellerInventory");
const Ad = require("../models/Ad");

exports.getHomePage = async (req, res) => {
  try {

    const { categoryId } = req.params;

    // Home Banner
    const homeBanner = await Banner.find({
      type: "homepage",
      isActive: true,
      category: categoryId
    }).select(
      "title image redirectUrl category"
    );

    

    // Trending Deals
    const trendingDeals = await Banner.find({
      type: "trending-deals",
      isActive: true,
      category: categoryId
    }).select(
      "title image redirectUrl category"
    );


    // Top Deals Of Week
    const topDealsOfWeek = await Ad.find({
  adType: "Monthly sale ads",
  isActive: true,
  category: categoryId
})
.populate("product", "name")
.select(
  "product  mediaUrl category"
);
    // Latest Launches
    const latestLaunches =
      await SellerInventory.find({
        isActive: true,
        category: categoryId
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(`
        name
        media
      `);

    // Top Brands
    const products =
      await SellerInventory.find({
        isActive: true,
        category: categoryId
      }).select("brand");

    const brandsMap = new Map();

    products.forEach(product => {

      if (
        product.brand?.name &&
        !brandsMap.has(product.brand.name)
      ) {
        brandsMap.set(
          product.brand.name,
          {
            name: product.brand.name,
            logo: product.brand.logo
          }
        );
      }

    });

    const topBrandsForYou =
      Array.from(
        brandsMap.values()
      ).slice(0, 10);

    return res.status(200).json({
      success: true,
      categoryId,
      homeBanner,
      latestLaunches,
       trendingDeals,
      topDealsOfWeek,
      topBrandsForYou
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

