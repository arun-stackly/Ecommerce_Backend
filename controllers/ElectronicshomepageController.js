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
    (value.startsWith("http://") ||
      value.startsWith("https://"))
  ) {
    return value;
  }

  // Base64 image
  if (
    typeof value === "string" &&
    value.startsWith("data:")
  ) {
    return value;
  }

  try {
    return await getS3SignedUrl(value);
  } catch (error) {
    console.error(
      "S3 Signed URL Error:",
      error.message
    );

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
        // {
        //   url: "products/image.jpg",
        //   type: "image"
        // }

        if (
          item &&
          typeof item === "object" &&
          item.url
        ) {
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
      })
    );
  }

  // Single string
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
   GET HOME PAGE
========================================================= */
exports.getHomePage = async (req, res) => {
  try {

    const { categoryId } = req.params;

    /* =====================================================
       1. HOME BANNER
    ===================================================== */

    const homeBanner = await Banner.find({
      type: "homepage",
      isActive: true,
      category: categoryId,
    })
      .select(
        "title image redirectUrl category"
      )
      .lean();

    const updatedHomeBanner = await Promise.all(
      homeBanner.map(async (banner) => ({
        ...banner,
        image: await getSignedUrl(banner.image),
      }))
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
        "title image redirectUrl category"
      )
      .lean();

    const updatedTrendingDeals = await Promise.all(
      trendingDeals.map(async (deal) => ({
        ...deal,
        image: await getSignedUrl(deal.image),
      }))
    );

    /* =====================================================
       3. TOP DEALS OF WEEK
    ===================================================== */

    const topDealsOfWeek = await Ad.find({
      adType: "Monthly sale ads",
      isActive: true,
      category: categoryId,
    })
      .populate("product", "name")
      .select(
        "product mediaUrl category"
      )
      .lean();

    const updatedTopDealsOfWeek =
      await Promise.all(
        topDealsOfWeek.map(async (ad) => ({
          ...ad,
          mediaUrl: await getSignedUrl(
            ad.mediaUrl
          ),
        }))
      );

    /* =====================================================
       4. LATEST LAUNCHES
    ===================================================== */

    const latestLaunches =
      await SellerInventory.find({
        isActive: true,
        category: categoryId,
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("name media")
        .lean();

    const updatedLatestLaunches =
      await Promise.all(
        latestLaunches.map(async (product) => ({
          ...product,
          media: await convertProductMedia(
            product.media
          ),
        }))
      );

    /* =====================================================
       5. TOP BRANDS
    ===================================================== */

    const products =
      await SellerInventory.find({
        isActive: true,
        category: categoryId,
      })
        .select("brand")
        .lean();

    const brandsMap = new Map();

    products.forEach((product) => {

      if (
        !product.brand ||
        !product.brand.name
      ) {
        return;
      }

      const brandName =
        product.brand.name.trim();

      if (!brandsMap.has(brandName)) {

        brandsMap.set(
          brandName,
          {
            name: brandName,
            logo: product.brand.logo || "",
          }
        );

      }
    });

    const topBrandsForYou =
      Array.from(
        brandsMap.values()
      ).slice(0, 10);

    /* =====================================================
       CONVERT BRAND LOGOS TO SIGNED URL
    ===================================================== */

    const updatedTopBrandsForYou =
      await Promise.all(
        topBrandsForYou.map(
          async (brand) => ({
            name: brand.name,
            logo: await getSignedUrl(
              brand.logo
            ),
          })
        )
      );

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */

    return res.status(200).json({
      success: true,
      categoryId,

      homeBanner:
        updatedHomeBanner,

      latestLaunches:
        updatedLatestLaunches,

      trendingDeals:
        updatedTrendingDeals,

      topDealsOfWeek:
        updatedTopDealsOfWeek,

      topBrandsForYou:
        updatedTopBrandsForYou,
    });

  } catch (error) {

    console.error(
      "Home Page Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};