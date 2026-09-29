const Banner = require("../models/Banner");
 
const {
  uploadToS3,
  getS3SignedUrl,
  deleteFromS3,
} = require("../utils/s3Helper");
 
/* =========================================================
   S3 SIGNED URL HELPER
========================================================= */
const getSignedUrl = async (key) => {
  if (!key) {
    return "";
  }
 
  // Already a complete URL
  if (
    typeof key === "string" &&
    (key.startsWith("http://") || key.startsWith("https://"))
  ) {
    return key;
  }
 
  // Existing Base64 image
  if (typeof key === "string" && key.startsWith("data:")) {
    return key;
  }
 
  try {
    return await getS3SignedUrl(key);
  } catch (error) {
    console.error("S3 Signed URL Error:", error.message);
    return key;
  }
};
 
/* =========================================================
   ADD BANNER
========================================================= */
exports.addBanner = async (req, res) => {
  try {
    const {
      title,
      redirectUrl,
      type,
      position,
      category,
      subcategory,
      subSubcategory,
      productType,
      isActive,
      priority,
      startDate,
      endDate,
    } = req.body;
 
    // Required title
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Banner title is required",
      });
    }
 
    // Required image
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image file is required",
      });
    }
 
    /* =====================================================
       UPLOAD IMAGE TO S3
    ===================================================== */
 
    const safeFileName = req.file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.-]/g, "");
 
    const s3Key = `banners/${Date.now()}-${safeFileName}`;
 
    await uploadToS3(req.file, s3Key);
 
    /* =====================================================
       CREATE BANNER
    ===================================================== */
 
    const banner = await Banner.create({
      title: title.trim(),
 
      // Store S3 KEY, not signed URL
      image: s3Key,
 
      redirectUrl: redirectUrl || "",
 
      type: type || "homepage",
 
      position: position || "hero",
 
      category: category || null,
 
      subcategory: subcategory || null,
 
      subSubcategory: subSubcategory || null,
 
      productType: productType || null,
 
      isActive:
        isActive === undefined
          ? true
          : isActive === true || isActive === "true",
 
      priority: priority || 1,
 
      startDate: startDate || null,
 
      endDate: endDate || null,
    });
 
    /* =====================================================
       RETURN SIGNED URL
    ===================================================== */
 
    const responseBanner = banner.toObject();
 
    responseBanner.image = await getSignedUrl(responseBanner.image);
 
    return res.status(201).json({
      success: true,
      message: "Banner added successfully",
      banner: responseBanner,
    });
  } catch (error) {
    console.error("Add Banner Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET MONTHLY BANNER
========================================================= */
exports.getMonthlyBanner = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    const banner = await Banner.findOne({
      category: categoryId,
      type: "monthly",
      isActive: true,
    }).lean();
 
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Monthly banner not found",
      });
    }
 
    banner.image = await getSignedUrl(banner.image);
 
    return res.status(200).json({
      success: true,
      banner,
    });
  } catch (error) {
    console.error("Get Monthly Banner Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET ALL BANNERS
========================================================= */
exports.getBanners = async (req, res) => {
  try {
    const { type } = req.query;
 
    const banners = await Banner.find({
      type: type || "homepage",
      isActive: true,
    })
      .sort({ priority: 1, createdAt: -1 })
      .lean();
 
    const updatedBanners = await Promise.all(
      banners.map(async (banner) => {
        banner.image = await getSignedUrl(banner.image);
        return banner;
      }),
    );
 
    return res.status(200).json({
      success: true,
      count: updatedBanners.length,
      banners: updatedBanners,
    });
  } catch (error) {
    console.error("Get Banners Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET BANNERS BY CATEGORY ID
========================================================= */
exports.getBannersByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    const banners = await Banner.find({
      category: categoryId,
      isActive: true,
    })
      .sort({ priority: 1, createdAt: -1 })
      .lean();
 
    if (!banners.length) {
      return res.status(404).json({
        success: false,
        message: "No banners found for this category",
      });
    }
 
    const updatedBanners = await Promise.all(
      banners.map(async (banner) => {
        banner.image = await getSignedUrl(banner.image);
        return banner;
      }),
    );
 
    return res.status(200).json({
      success: true,
      count: updatedBanners.length,
      banners: updatedBanners,
    });
  } catch (error) {
    console.error("Get Banners By Category Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET BANNERS BY PRODUCT TYPE ID
========================================================= */
exports.getBannersByProductType = async (req, res) => {
  try {
    const { productTypeId } = req.params;
 
    const banners = await Banner.find({
      productType: productTypeId,
      isActive: true,
    })
      .sort({ priority: 1, createdAt: -1 })
      .lean();
 
    if (!banners.length) {
      return res.status(404).json({
        success: false,
        message: "No banners found for this product type",
      });
    }
 
    const updatedBanners = await Promise.all(
      banners.map(async (banner) => {
        banner.image = await getSignedUrl(banner.image);
        return banner;
      }),
    );
 
    return res.status(200).json({
      success: true,
      count: updatedBanners.length,
      banners: updatedBanners,
    });
  } catch (error) {
    console.error("Get Banners By Product Type Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET BANNERS BY SUBCATEGORY ID
========================================================= */
exports.getBannersBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    const banners = await Banner.find({
      subcategory: subcategoryId,
      isActive: true,
    })
      .sort({ priority: 1, createdAt: -1 })
      .lean();
 
    if (!banners.length) {
      return res.status(404).json({
        success: false,
        message: "No banners found for this subcategory",
      });
    }
 
    const updatedBanners = await Promise.all(
      banners.map(async (banner) => {
        banner.image = await getSignedUrl(banner.image);
        return banner;
      }),
    );
 
    return res.status(200).json({
      success: true,
      count: updatedBanners.length,
      banners: updatedBanners,
    });
  } catch (error) {
    console.error("Get Banners By Subcategory Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET BANNERS BY SUB-SUBCATEGORY ID
========================================================= */
exports.getBannersBySubSubcategory = async (req, res) => {
  try {
    const { subSubcategoryId } = req.params;
 
    const banners = await Banner.find({
      subSubcategory: subSubcategoryId,
      isActive: true,
    })
      .sort({ priority: 1, createdAt: -1 })
      .lean();
 
    if (!banners.length) {
      return res.status(404).json({
        success: false,
        message: "No banners found for this sub-subcategory",
      });
    }
 
    const updatedBanners = await Promise.all(
      banners.map(async (banner) => {
        banner.image = await getSignedUrl(banner.image);
        return banner;
      }),
    );
 
    return res.status(200).json({
      success: true,
      count: updatedBanners.length,
      banners: updatedBanners,
    });
  } catch (error) {
    console.error("Get Banners By Sub-Subcategory Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   UPDATE BANNER
========================================================= */
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
 
    const banner = await Banner.findById(id);
 
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }
 
    /* =====================================================
       UPDATE IMAGE IF NEW FILE IS PROVIDED
    ===================================================== */
 
    if (req.file) {
      const safeFileName = req.file.originalname
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.-]/g, "");
 
      const newS3Key = `banners/${Date.now()}-${safeFileName}`;
 
      // Upload new image
      await uploadToS3(req.file, newS3Key);
 
      // Delete old image from S3
      if (
        banner.image &&
        typeof banner.image === "string" &&
        !banner.image.startsWith("http://") &&
        !banner.image.startsWith("https://") &&
        !banner.image.startsWith("data:")
      ) {
        try {
          await deleteFromS3(banner.image);
        } catch (deleteError) {
          console.error("Old Banner S3 Delete Error:", deleteError.message);
        }
      }
 
      banner.image = newS3Key;
    }
 
    /* =====================================================
       UPDATE OTHER FIELDS
    ===================================================== */
 
    if (req.body.title !== undefined) {
      banner.title = req.body.title.trim();
    }
 
    if (req.body.redirectUrl !== undefined) {
      banner.redirectUrl = req.body.redirectUrl;
    }
 
    if (req.body.type !== undefined) {
      banner.type = req.body.type;
    }
 
    if (req.body.position !== undefined) {
      banner.position = req.body.position;
    }
 
    if (req.body.category !== undefined) {
      banner.category = req.body.category || null;
    }
 
    if (req.body.subcategory !== undefined) {
      banner.subcategory = req.body.subcategory || null;
    }
 
    if (req.body.subSubcategory !== undefined) {
      banner.subSubcategory = req.body.subSubcategory || null;
    }
 
    if (req.body.productType !== undefined) {
      banner.productType = req.body.productType || null;
    }
 
    if (req.body.isActive !== undefined) {
      banner.isActive =
        req.body.isActive === true || req.body.isActive === "true";
    }
 
    if (req.body.priority !== undefined) {
      banner.priority = req.body.priority;
    }
 
    if (req.body.startDate !== undefined) {
      banner.startDate = req.body.startDate || null;
    }
 
    if (req.body.endDate !== undefined) {
      banner.endDate = req.body.endDate || null;
    }
 
    await banner.save();
 
    /* =====================================================
       RETURN SIGNED URL
    ===================================================== */
 
    const responseBanner = banner.toObject();
 
    responseBanner.image = await getSignedUrl(responseBanner.image);
 
    return res.status(200).json({
      success: true,
      message: "Banner updated successfully",
      banner: responseBanner,
    });
  } catch (error) {
    console.error("Update Banner Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   DELETE BANNER
========================================================= */
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
 
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }
 
    /* =====================================================
       DELETE IMAGE FROM S3
    ===================================================== */
 
    if (
      banner.image &&
      typeof banner.image === "string" &&
      !banner.image.startsWith("http://") &&
      !banner.image.startsWith("https://") &&
      !banner.image.startsWith("data:")
    ) {
      try {
        await deleteFromS3(banner.image);
      } catch (deleteError) {
        console.error("Banner S3 Delete Error:", deleteError.message);
      }
    }
 
    /* =====================================================
       DELETE DATABASE RECORD
    ===================================================== */
 
    await Banner.findByIdAndDelete(req.params.id);
 
    return res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Delete Banner Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 