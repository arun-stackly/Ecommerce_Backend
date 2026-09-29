const Banner = require("../models/Banner");
const SellerInventory = require("../models/SellerInventory");
const Ad = require("../models/Ad");
 
const { getS3SignedUrl } = require("../utils/s3Helper");
 
/* =========================================================
   S3 SIGNED URL HELPER
========================================================= */
const getSignedUrl = async (value) => {
  if (!value) return "";
 
  // Already a complete URL
  if (
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"))
  ) {
    return value;
  }
 
  // Base64 image
  if (typeof value === "string" && value.startsWith("data:")) {
    return value;
  }
 
  try {
    return await getS3SignedUrl(value);
  } catch (error) {
    console.error("S3 Signed URL Error:", error.message);
 
    return "";
  }
};
 
/* =========================================================
   CONVERT PRODUCT MEDIA
========================================================= */
const convertProductMedia = async (media) => {
  if (!media) return [];
 
  if (Array.isArray(media)) {
    return Promise.all(
      media.map(async (item) => {
        // Example:
        // { url: "products/image.jpg", type: "image" }
 
        if (item && typeof item === "object" && item.url) {
          return {
            ...item,
            url: await getSignedUrl(item.url),
          };
        }
 
        // Example:
        // "products/image.jpg"
        if (typeof item === "string") {
          return {
            url: await getSignedUrl(item),
            type: "image",
          };
        }
 
        return item;
      }),
    );
  }
 
  if (typeof media === "string") {
    return [
      {
        url: await getSignedUrl(media),
        type: "image",
      },
    ];
  }
 
  return [];
};
 
/* =========================================================
   GET FASHION HOME PAGE
 
   GET /api/fashion/home/:categoryId
========================================================= */
exports.getHomePage = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    console.log("========================================");
    console.log("FASHION HOMEPAGE CONTROLLER");
    console.log("Category ID:", categoryId);
    console.log("========================================");
 
    /* =====================================================
       VALIDATE CATEGORY
    ===================================================== */
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }
 
    /* =====================================================
       1. HOME BANNERS
    ===================================================== */
    const homeBanner = await Banner.find({
      type: "homepage",
      isActive: true,
      category: categoryId,
    })
      .select(
        "title image redirectUrl type position category subcategory subSubcategory productType isActive priority startDate endDate",
      )
      .sort({
        priority: 1,
        createdAt: -1,
      })
      .lean();
 
    const updatedHomeBanner = await Promise.all(
      homeBanner.map(async (banner) => {
        return {
          ...banner,
          image: await getSignedUrl(banner.image),
        };
      }),
    );
 
    /* =====================================================
       2. TRENDING DEALS
    ===================================================== */
    const trendingDeals = await Banner.find({
      type: "trending-deals",
      isActive: true,
      category: categoryId,
    })
      .select(
        "title image redirectUrl type position category subcategory subSubcategory productType isActive priority",
      )
      .sort({
        priority: 1,
        createdAt: -1,
      })
      .lean();
 
    const updatedTrendingDeals = await Promise.all(
      trendingDeals.map(async (deal) => {
        return {
          ...deal,
          image: await getSignedUrl(deal.image),
        };
      }),
    );
 
    /* =====================================================
       3. TOP DEALS OF THE WEEK
    ===================================================== */
    const topDealsOfWeek = await Ad.find({
      adType: "Monthly sale ads",
      isActive: true,
      category: categoryId,
    })
      .populate("product", "name")
      .select("product mediaUrl category adType isActive")
      .lean();
 
    const updatedTopDealsOfWeek = await Promise.all(
      topDealsOfWeek.map(async (ad) => {
        return {
          ...ad,
          mediaUrl: await getSignedUrl(ad.mediaUrl),
        };
      }),
    );
 
    /* =====================================================
       4. LATEST LAUNCHES
    ===================================================== */
    const latestLaunches = await SellerInventory.find({
      isActive: true,
      category: categoryId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(10)
      .select("name media brand price discountPrice category createdAt")
      .lean();
 
    const updatedLatestLaunches = await Promise.all(
      latestLaunches.map(async (product) => {
        const updatedProduct = {
          ...product,
 
          media: await convertProductMedia(product.media),
        };
 
        /* ---------------------------------------------
             EMBEDDED BRAND
             Your schema stores brand as:
             {
               name: String,
               logo: String
             }
          --------------------------------------------- */
        if (product.brand && typeof product.brand === "object") {
          updatedProduct.brand = {
            ...product.brand,
 
            logo: await getSignedUrl(product.brand.logo),
          };
        }
 
        return updatedProduct;
      }),
    );
 
    /* =====================================================
       5. TOP BRANDS FOR YOU
    ===================================================== */
    const products = await SellerInventory.find({
      isActive: true,
      category: categoryId,
    })
      .select("brand")
      .lean();
 
    const brandsMap = new Map();
 
    products.forEach((product) => {
      if (!product.brand || typeof product.brand !== "object") {
        return;
      }
 
      const brandName = product.brand.name?.trim();
 
      if (!brandName) {
        return;
      }
 
      if (!brandsMap.has(brandName)) {
        brandsMap.set(brandName, {
          name: brandName,
          logo: product.brand.logo || "",
        });
      }
    });
 
    const topBrandsForYou = Array.from(brandsMap.values()).slice(0, 10);
 
    const updatedTopBrandsForYou = await Promise.all(
      topBrandsForYou.map(async (brand) => {
        return {
          name: brand.name,
 
          logo: await getSignedUrl(brand.logo),
        };
      }),
    );
 
    /* =====================================================
       FINAL RESPONSE
    ===================================================== */
    return res.status(200).json({
      success: true,
 
      categoryId,
 
      homeBanner: updatedHomeBanner,
 
      trendingDeals: updatedTrendingDeals,
 
      topDealsOfWeek: updatedTopDealsOfWeek,
 
      latestLaunches: updatedLatestLaunches,
 
      topBrandsForYou: updatedTopBrandsForYou,
    });
  } catch (error) {
    console.error("Fashion Homepage Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 