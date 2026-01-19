const Ad = require("../models/Advertisement");

/* ================= CREATE AD ================= */
exports.createAd = async (req, res) => {
  const ad = await Ad.create({
    sellerId: req.user._id, // ✅ correct field
    ...req.body,
  });

  res.status(201).json(ad);
};

/* ================= GET SELLER ADS ================= */
exports.getAds = async (req, res) => {
  const ads = await Ad.find({
    sellerId: req.user._id, // ✅ correct field
  }).sort({ createdAt: -1 });

  res.json(ads);
};
