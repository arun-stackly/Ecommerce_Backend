const Ad = require("../models/Ad");

/*
-----------------------------------------
Create Advertisement
Used when user clicks "Continue"
-----------------------------------------
POST /api/ads
*/
exports.createAd = async (req, res) => {
  try {
    const { status, description, image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Image is required"
      });
    }

    const ad = await Ad.create({
      seller: req.user.id,
      status,
      description,
      image
    });

    res.status(201).json({
      success: true,
      message: "Advertisement created successfully",
      ad
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
-----------------------------------------
Bulk Create Ads
Used for "Save & Add More"
-----------------------------------------
POST /api/ads/bulk
*/
exports.createMultipleAds = async (req, res) => {
  try {

    const adsData = req.body.ads;

    if (!adsData || adsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ads data required"
      });
    }

    const ads = adsData.map(ad => ({
      ...ad,
      seller: req.user.id
    }));

    const createdAds = await Ad.insertMany(ads);

    res.status(201).json({
      success: true,
      message: "Ads created successfully",
      ads: createdAds
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



/*
-----------------------------------------
Get Seller Ads
Used to display ads in Advertisement Page
-----------------------------------------
GET /api/ads/my-ads
*/
exports.getSellerAds = async (req, res) => {
  try {

    const ads = await Ad.find({ seller: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: ads.length,
      ads
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
/*
-----------------------------------------
update Advertisement
update  in UI
-----------------------------------------
Put /api/ads/:id
*/
exports.updateAd = async (req, res) => {
  try {

    const { image, description } = req.body;

    const updateData = {};

    if (image) {
      updateData.image = image;
    }

    if (description) {
      updateData.description = description;
    }

    const ad = await Ad.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      updateData,
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }

    res.json({
      success: true,
      message: "Ad updated successfully",
      ad
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
-----------------------------------------
Pause Advertisement
Pause button in UI
-----------------------------------------
PATCH /api/ads/:id/pause
*/
exports.pauseAd = async (req, res) => {
  try {

    const ad = await Ad.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      { status: false },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }

    res.json({
      success: true,
      message: "Ad paused successfully",
      ad
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


/*
-----------------------------------------
Resume Advertisement
-----------------------------------------
PATCH /api/ads/:id/resume
*/
exports.resumeAd = async (req, res) => {
  try {

    const ad = await Ad.findOneAndUpdate(
      { _id: req.params.id, seller: req.user.id },
      { status: true },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }

    res.json({
      success: true,
      message: "Ad resumed successfully",
      ad
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/*
-----------------------------------------
Delete Advertisement
Remove button in UI
-----------------------------------------
DELETE /api/ads/:id
*/
exports.deleteAd = async (req, res) => {
  try {

    const ad = await Ad.findOneAndDelete({
      _id: req.params.id,
      seller: req.user.id
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found"
      });
    }

    res.json({
      success: true,
      message: "Ad removed successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



/*
-----------------------------------------
Get Active Ads
Used in Landing Page
-----------------------------------------
GET /api/ads/active
*/
exports.getActiveAds = async (req, res) => {
  try {

    const ads = await Ad.find({ status: true })
      .populate("seller", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ads.length,
      ads
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};