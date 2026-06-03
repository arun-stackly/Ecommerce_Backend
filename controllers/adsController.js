const Ad = require("../models/Ad");

/* =========================================
   CREATE ADVERTISEMENT
========================================= */
exports.createAd = async (req, res) => {
  try {
    const {
      product,
      category,
      subcategory,
      subSubcategory,
      productType,
      description,
      mediaUrl,
      adType,
    } = req.body;

    const ad = await Ad.create({
      seller: req.user._id,
      product,
      category,
      subcategory,
      subSubcategory,
      productType,
      description,
      mediaUrl,
      adType,
    });

    return res.status(201).json({
      success: true,
      message: "Advertisement created successfully",
      ad,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   BULK CREATE ADS
========================================= */
exports.createMultipleAds = async (req, res) => {
  try {

    const { ads } = req.body;

    if (!ads || !ads.length) {
      return res.status(400).json({
        success: false,
        message: "Ads data is required",
      });
    }

    const adsData = ads.map((ad) => ({
      ...ad,
      seller: req.user._id,
    }));

    const createdAds =
      await Ad.insertMany(adsData);

    return res.status(201).json({
      success: true,
      message: "Advertisements created successfully",
      ads: createdAds,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   GET SELLER ADS
========================================= */
exports.getSellerAds = async (req, res) => {
  try {

    const ads = await Ad.find({
      seller: req.user._id,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .populate("productType", "name")
      .populate("product", "name price media")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: ads.length,
      ads,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   GET AD BY ID
========================================= */
exports.getAdById = async (req, res) => {
  try {

    const ad = await Ad.findOne({
      _id: req.params.id,
      seller: req.user._id,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .populate("productType", "name")
      .populate("product", "name price media");

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    return res.status(200).json({
      success: true,
      ad,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   UPDATE AD
========================================= */
exports.updateAd = async (req, res) => {
  try {

    const ad = await Ad.findOneAndUpdate(
      {
        _id: req.params.id,
        seller: req.user._id,
      },
      req.body,
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Advertisement updated successfully",
      ad,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   PAUSE AD
========================================= */
exports.pauseAd = async (req, res) => {
  try {

    const ad = await Ad.findOneAndUpdate(
      {
        _id: req.params.id,
        seller: req.user._id,
      },
      {
        isActive: false,
      },
      {
        new: true,
      }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Advertisement paused successfully",
      ad,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   RESUME AD
========================================= */
exports.resumeAd = async (req, res) => {
  try {

    const ad = await Ad.findOneAndUpdate(
      {
        _id: req.params.id,
        seller: req.user._id,
      },
      {
        isActive: true,
      },
      {
        new: true,
      }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Advertisement resumed successfully",
      ad,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   DELETE AD
========================================= */
exports.deleteAd = async (req, res) => {
  try {

    const ad = await Ad.findOneAndDelete({
      _id: req.params.id,
      seller: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Advertisement deleted successfully",
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   GET ACTIVE ADS
========================================= */
exports.getActiveAds = async (req, res) => {
  try {

    const ads = await Ad.find({
      isActive: true,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .populate("productType", "name")
      .populate("product", "name price media")
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: ads.length,
      ads,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};