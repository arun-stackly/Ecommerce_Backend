const Ad = require("../models/Advertisement");

/* ================= CREATE OR UPDATE AD ================= */
exports.createOrUpdateAd = async (req, res) => {
  try {
    const { adType, description, mediaType, startDate, endDate } = req.body;

    // Validation
    if (!adType || !mediaType) {
      return res.status(400).json({
        message: "adType and mediaType are required",
      });
    }

    // Only allow valid ad types
    const allowedTypes = ["weekend", "monthly", "seasonal"];
    if (!allowedTypes.includes(adType)) {
      return res.status(400).json({
        message: "Invalid ad type",
      });
    }

    // Prepare update data
    const updateData = {
      sellerId: req.user._id,
      adType,
      description,
      mediaType,
      startDate,
      endDate,
      status: "active",
    };

    // If file uploaded (multer)
    if (req.file) {
      updateData.mediaUrl = req.file.path;
    }

    // Upsert (one ad per type per seller)
    const ad = await Ad.findOneAndUpdate(
      { sellerId: req.user._id, adType },
      updateData,
      { new: true, upsert: true },
    );

    res.status(200).json({
      success: true,
      message: "Ad saved successfully",
      data: ad,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET SELLER ADS ================= */
exports.getSellerAds = async (req, res) => {
  try {
    const ads = await Ad.find({
      sellerId: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE AD ================= */
exports.deleteAd = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findOneAndDelete({
      _id: id,
      sellerId: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE AD STATUS ================= */
exports.updateAdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatus = ["active", "paused", "expired"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const ad = await Ad.findOneAndUpdate(
      { _id: id, sellerId: req.user._id },
      { status },
      { new: true },
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ad status updated",
      data: ad,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
