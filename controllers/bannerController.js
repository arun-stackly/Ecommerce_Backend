const Banner = require("../models/Banner");


// ✅ ADD BANNER
exports.addBanner = async (req, res) => {
  try {
    const banner = new Banner(req.body);
    await banner.save();

    res.status(201).json({
      message: "Banner added successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ GET MONTHLY BANNER
exports.getMonthlyBanner = async (req, res) => {
  try {
    const banner = await Banner.findOne({
      type: "monthly",
      isActive: true,
    });

    if (!banner) {
      return res.status(404).json({ message: "Monthly banner not found" });
    }

    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ OPTIONAL: GET BY QUERY TYPE (you already have)
exports.getBanners = async (req, res) => {
  try {
    const { type } = req.query;

    const banners = await Banner.find({
      type: type || "homepage",
      isActive: true,
    });

    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};