const mongoose = require("mongoose");
const Ad = require("../models/Ad");
const SellerInventory = require("../models/SellerInventory");

exports.getProductsForAd = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      subSubcategory,
      productType,
    } = req.query;

    const filter = {
      seller: req.user._id, // change to seller if your schema uses seller
      isActive: true,
    };

    // Convert ObjectId fields
    if (
      category &&
      mongoose.Types.ObjectId.isValid(category)
    ) {
      filter.category =
        new mongoose.Types.ObjectId(category);
    }

    if (
      subcategory &&
      mongoose.Types.ObjectId.isValid(subcategory)
    ) {
      filter.subcategory =
        new mongoose.Types.ObjectId(subcategory);
    }

    if (
      subSubcategory &&
      mongoose.Types.ObjectId.isValid(subSubcategory)
    ) {
      filter.subSubcategory =
        new mongoose.Types.ObjectId(subSubcategory);
    }

    if (
      productType &&
      mongoose.Types.ObjectId.isValid(productType)
    ) {
      filter.productType =
        new mongoose.Types.ObjectId(productType);
    }

    console.log("User ID:", req.user._id);
    console.log("Filter:", filter);

    const products = await SellerInventory.find(filter)
      .populate("productType", "name")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .select(
        "_id name productType category subcategory subSubcategory media"
      );

    console.log(
      "Products Found:",
      products.length
    );

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
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

    // Validate Product
    const inventory = await SellerInventory.findOne({
      _id: product,
      seller: req.user._id,
      isActive: true,
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found or does not belong to seller",
      });
    }

    // Validate hierarchy
    if (
      inventory.category.toString() !== category ||
      inventory.subcategory?.toString() !== subcategory ||
      inventory.subSubcategory?.toString() !== subSubcategory ||
      inventory.productType?.toString() !== productType
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected product does not match category hierarchy",
      });
    }

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