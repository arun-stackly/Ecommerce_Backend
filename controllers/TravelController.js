const TravelHomepage = require("../models/Travel");
 
const { getS3SignedUrl } = require("../utils/s3Helper");
 
/* =========================================
   S3 SIGNED URL HELPER
========================================= */
 
const getSignedUrl = async (value) => {
  if (!value) return "";
 
  try {
    let key = value;
 
    /* =========================================
       FULL URL
       Example:
       https://example.com/images/banner.jpg
       https://bucket.s3.amazonaws.com/banner.jpg
    ========================================= */
 
    if (
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"))
    ) {
      try {
        const url = new URL(value);
 
        // Remove query parameters
        let pathname = decodeURIComponent(url.pathname);
 
        // Remove first /
        key = pathname.replace(/^\/+/, "");
 
        /*
         * If URL contains /images/banner.jpg,
         * use banner.jpg as S3 key.
         */
        if (key.includes("/")) {
          key = key.split("/").pop();
        }
      } catch (urlError) {
        console.error("Invalid image URL:", value);
        return "";
      }
    }
 
    /* =========================================
       BASE64 IMAGE
    ========================================= */
 
    if (typeof key === "string" && key.startsWith("data:")) {
      return key;
    }
 
    /* =========================================
       GET S3 SIGNED URL
    ========================================= */
 
    const signedUrl = await getS3SignedUrl(key);
 
    return signedUrl || "";
  } catch (error) {
    console.error("S3 Signed URL Error:", value, error.message);
 
    return "";
  }
};
 
/* =========================================
   CONVERT TRAVEL HOMEPAGE IMAGES
   TO S3 SIGNED URLS
========================================= */
 
const convertTravelImages = async (homepage) => {
  if (!homepage) return homepage;
 
  const data = homepage.toObject ? homepage.toObject() : { ...homepage };
 
  /* =========================================
     BANNER
  ========================================= */
 
  if (data.banner && data.banner.image) {
    data.banner.image = await getSignedUrl(data.banner.image);
  }
 
  /* =========================================
     OFFERS
  ========================================= */
 
  if (Array.isArray(data.offers)) {
    data.offers = await Promise.all(
      data.offers.map(async (offer) => {
        if (offer.image) {
          offer.image = await getSignedUrl(offer.image);
        }
 
        return offer;
      }),
    );
  }
 
  /* =========================================
     POPULAR DESTINATIONS
  ========================================= */
 
  if (Array.isArray(data.popularDestinations)) {
    data.popularDestinations = await Promise.all(
      data.popularDestinations.map(async (destination) => {
        if (destination.image) {
          destination.image = await getSignedUrl(destination.image);
        }
 
        return destination;
      }),
    );
  }
 
  /* =========================================
     BENEFITS
  ========================================= */
 
  if (Array.isArray(data.benefits)) {
    data.benefits = await Promise.all(
      data.benefits.map(async (benefit) => {
        if (benefit.icon) {
          benefit.icon = await getSignedUrl(benefit.icon);
        }
 
        return benefit;
      }),
    );
  }
 
  return data;
};
 
/* =========================================
   CREATE HOMEPAGE
========================================= */
 
exports.createHomepage = async (req, res) => {
  try {
    const homepage = await TravelHomepage.create(req.body);
 
    const homepageData = await convertTravelImages(homepage);
 
    res.status(201).json({
      success: true,
      message: "Homepage created successfully",
      data: homepageData,
    });
  } catch (error) {
    console.error("Create Travel Homepage Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================
   GET HOMEPAGE BY SUBCATEGORY
========================================= */
 
exports.getHomepageBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    const homepage = await TravelHomepage.findOne({
      subcategory: subcategoryId,
      isActive: true,
    })
      .populate("category", "name")
      .populate("subcategory", "name");
 
    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: "Homepage not found",
      });
    }
 
    const homepageData = await convertTravelImages(homepage);
 
    res.status(200).json({
      success: true,
      data: homepageData,
    });
  } catch (error) {
    console.error("Get Travel Homepage Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================
   UPDATE HOMEPAGE
========================================= */
 
exports.updateHomepage = async (req, res) => {
  try {
    const homepage = await TravelHomepage.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );
 
    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: "Homepage not found",
      });
    }
 
    const homepageData = await convertTravelImages(homepage);
 
    res.status(200).json({
      success: true,
      message: "Homepage updated successfully",
      data: homepageData,
    });
  } catch (error) {
    console.error("Update Travel Homepage Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================
   DELETE HOMEPAGE
========================================= */
 
exports.deleteHomepage = async (req, res) => {
  try {
    const homepage = await TravelHomepage.findByIdAndDelete(req.params.id);
 
    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: "Homepage not found",
      });
    }
 
    res.status(200).json({
      success: true,
      message: "Homepage deleted successfully",
    });
  } catch (error) {
    console.error("Delete Travel Homepage Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================
   GET ALL HOMEPAGES
========================================= */
 
exports.getAllHomepages = async (req, res) => {
  try {
    const homepages = await TravelHomepage.find({
      isActive: true,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });
 
    const homepagesData = await Promise.all(
      homepages.map(async (homepage) => {
        return await convertTravelImages(homepage);
      }),
    );
 
    res.status(200).json({
      success: true,
      count: homepagesData.length,
      data: homepagesData,
    });
  } catch (error) {
    console.error("Get All Travel Homepages Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 