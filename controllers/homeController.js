const Product = require("../models/Product");
const Banner = require("../models/Banner");

exports.getHomeData = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      type: "homepage",
      isActive: true,
    });

    const latestLaunches = await Product.find({ status: "active" })
      .sort({ createdAt: -1 })
      .limit(10);

    const topDeal = await Product.findOne({ isTopDeal: true });

    const upcomingDeals = await Product.find({
      isUpcoming: true,
    }).limit(10);

    const samsungDeals = await Product.find({
      brand: "Samsung",
      discountPrice: { $exists: true },
    }).limit(10);

    const oppoDeals = await Product.find({
      brand: "Oppo",
      discountPrice: { $exists: true },
    }).limit(10);

    const vivoDeals = await Product.find({
      brand: "Vivo",
      discountPrice: { $exists: true },
    }).limit(10);

    res.json({
      banner,
      latestLaunches,
      topDeal,
      upcomingDeals,
      brandDeals: {
        samsung: samsungDeals,
        oppo: oppoDeals,
        vivo: vivoDeals,   // ✅ added here
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};