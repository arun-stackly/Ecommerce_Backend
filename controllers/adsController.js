const Ad = require("../models/Ad");

/* ==============================
   BULK SAVE (UPSERT)
============================== */
exports.saveAds = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { ads } = req.body;

    if (!Array.isArray(ads)) {
      return res.status(400).json({ message: "Ads must be an array" });
    }

    const results = [];

    for (const ad of ads) {
      if (!ad.type || !ad.mediaUrl) continue;

      const updatedAd = await Ad.findOneAndUpdate(
        { seller: sellerId, type: ad.type },
        {
          $set: {
            description: ad.description || "",
            mediaUrl: ad.mediaUrl,
            isActive: ad.isActive ?? true,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

      results.push(updatedAd);
    }

    res.status(200).json({
      message: "Ads saved successfully",
      data: results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   CREATE SINGLE AD (with upload)
============================== */
exports.createAd = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { type, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Media file required" });
    }

    const ad = await Ad.findOneAndUpdate(
      { seller: sellerId, type },
      {
        $set: {
          description,
          mediaUrl: `/uploads/${req.file.filename}`,
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(201).json({
      message: "Ad saved successfully",
      data: ad,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   GET ALL ACTIVE ADS (Landing)
============================== */
exports.getAds = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = { isActive: true };
    if (type) filter.type = type;

    const ads = await Ad.find(filter)
      .populate("seller", "storeName")
      .sort({ createdAt: -1 });

    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   GET MY ADS (Seller Dashboard)
============================== */
exports.getMyAds = async (req, res) => {
  try {
    const ads = await Ad.find({ seller: req.user._id });

    res.status(200).json(ads);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   UPDATE AD
============================== */
exports.updateAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    if (!ad.seller.equals(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (req.file) {
      ad.mediaUrl = `/uploads/${req.file.filename}`;
    }

    if (req.body.description !== undefined)
      ad.description = req.body.description;

    if (req.body.isActive !== undefined)
      ad.isActive = req.body.isActive;

    await ad.save();

    res.status(200).json({
      message: "Ad updated successfully",
      data: ad,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ==============================
   DELETE AD
============================== */
exports.deleteAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({ message: "Ad not found" });
    }

    if (!ad.seller.equals(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await ad.deleteOne();

    res.status(200).json({
      message: "Ad deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};