const mongoose = require("mongoose");
 
const Banner = require("../models/Banner");
const SellerInventory = require("../models/SellerInventory");
 
const { getS3SignedUrl } = require("../utils/s3Helper");
 
/* =====================================================
   S3 SIGNED URL HELPER
===================================================== */
 
const getSignedUrl = async (value) => {
  if (!value) return null;
 
  try {
    return await getS3SignedUrl(value);
  } catch (error) {
    console.error("S3 Signed URL Error:", error.message);
    return null;
  }
};
 
/* =====================================================
   CONVERT MEDIA ARRAY TO SIGNED URLS
===================================================== */
 
const convertMediaToSignedUrls = async (media) => {
  if (!Array.isArray(media)) return [];
 
  return await Promise.all(
    media.map(async (item) => {
      const plainItem =
        item && typeof item.toObject === "function" ? item.toObject() : item;
 
      return {
        ...plainItem,
        url: await getSignedUrl(item?.url),
      };
    }),
  );
};
 
/* =====================================================
   CONVERT PRODUCT MEDIA
===================================================== */
 
const convertProductMedia = async (product) => {
  if (!product) return product;
 
  const productData =
    typeof product.toObject === "function" ? product.toObject() : product;
 
  /* ===== MEDIA ===== */
 
  if (Array.isArray(productData.media)) {
    productData.media = await convertMediaToSignedUrls(productData.media);
  }
 
  /* ===== IMAGE ===== */
 
  if (productData.image) {
    productData.image = await getSignedUrl(productData.image);
  }
 
  /* ===== BRAND ===== */
 
  if (productData.brand) {
    if (typeof productData.brand === "object") {
      productData.brand = {
        ...productData.brand,
        logo: await getSignedUrl(productData.brand.logo),
      };
    }
  }
 
  /* ===== BRANDS ARRAY ===== */
 
  if (Array.isArray(productData.brands)) {
    productData.brands = await Promise.all(
      productData.brands.map(async (brand) => ({
        ...brand,
        logo: await getSignedUrl(brand?.logo),
      })),
    );
  }
 
  return productData;
};
 
/* =====================================================
   CONVERT MULTIPLE PRODUCTS
===================================================== */
 
const convertProductsMedia = async (products) => {
  return await Promise.all(
    products.map((product) => convertProductMedia(product)),
  );
};
 
/* =====================================================
   CONVERT BANNER
===================================================== */
 
const convertBanner = async (banner) => {
  if (!banner) return banner;
 
  const bannerData =
    typeof banner.toObject === "function" ? banner.toObject() : banner;
 
  /* ===== IMAGE ===== */
 
  if (bannerData.image) {
    bannerData.image = await getSignedUrl(bannerData.image);
  }
 
  /* ===== IMAGE URL ===== */
 
  if (bannerData.imageUrl) {
    bannerData.imageUrl = await getSignedUrl(bannerData.imageUrl);
  }
 
  /* ===== MEDIA ARRAY ===== */
 
  if (Array.isArray(bannerData.media)) {
    bannerData.media = await convertMediaToSignedUrls(bannerData.media);
  }
 
  /* ===== MOBILE IMAGE ===== */
 
  if (bannerData.mobileImage) {
    bannerData.mobileImage = await getSignedUrl(bannerData.mobileImage);
  }
 
  /* ===== DESKTOP IMAGE ===== */
 
  if (bannerData.desktopImage) {
    bannerData.desktopImage = await getSignedUrl(bannerData.desktopImage);
  }
 
  return bannerData;
};
 
/* =====================================================
   CONVERT MULTIPLE BANNERS
===================================================== */
 
const convertBanners = async (banners) => {
  return await Promise.all(banners.map((banner) => convertBanner(banner)));
};
 
/* =====================================================
   GET BANNERS BY SUBCATEGORY
===================================================== */
 
exports.getBannersBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    const banners = await Banner.find({
      subcategory: subcategoryId,
      isActive: true,
    });
 
    const convertedBanners = await convertBanners(banners);
 
    res.status(200).json({
      success: true,
      count: convertedBanners.length,
      banners: convertedBanners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =====================================================
   GET BANNERS BY CATEGORY
===================================================== */
 
exports.getBannersByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    const banners = await Banner.find({
      category: categoryId,
      isActive: true,
    });
 
    const convertedBanners = await convertBanners(banners);
 
    res.status(200).json({
      success: true,
      count: convertedBanners.length,
      banners: convertedBanners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =====================================================
   GET BANNERS BY SUB SUBCATEGORY
===================================================== */
 
exports.getBannersBySubSubCategory = async (req, res) => {
  try {
    const { subSubCategoryId } = req.params;
 
    const banners = await Banner.find({
      subSubcategory: subSubCategoryId,
      isActive: true,
    });
 
    const convertedBanners = await convertBanners(banners);
 
    res.status(200).json({
      success: true,
      count: convertedBanners.length,
      banners: convertedBanners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =====================================================
   GET TOP RATED PRODUCTS
   BY SUBCATEGORY
===================================================== */
 
exports.getTopRatedProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    const products = await SellerInventory.aggregate([
      {
        $match: {
          subcategory: new mongoose.Types.ObjectId(subcategoryId),
          isActive: true,
        },
      },
 
      {
        $addFields: {
          reviewCount: {
            $size: {
              $ifNull: ["$reviews", []],
            },
          },
 
          averageRating: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $ifNull: ["$reviews", []],
                    },
                  },
                  0,
                ],
              },
              {
                $avg: "$reviews.rating",
              },
              0,
            ],
          },
        },
      },
 
      {
        $match: {
          reviewCount: {
            $gt: 0,
          },
        },
      },
 
      {
        $sort: {
          averageRating: -1,
          reviewCount: -1,
        },
      },
 
      {
        $limit: 10,
      },
 
      {
        $project: {
          _id: 1,
          seller: 1,
          name: 1,
          description: 1,
          category: 1,
          subcategory: 1,
          subSubcategory: 1,
          media: 1,
          image: 1,
          brand: 1,
          brands: 1,
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);
 
    const convertedProducts = await convertProductsMedia(products);
 
    res.status(200).json({
      success: true,
      count: convertedProducts.length,
      products: convertedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =====================================================
   GET TOP RATED PRODUCTS
   BY CATEGORY
===================================================== */
 
exports.getTopRatedProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    const products = await SellerInventory.aggregate([
      {
        $match: {
          category: new mongoose.Types.ObjectId(categoryId),
          isActive: true,
        },
      },
 
      {
        $addFields: {
          reviewCount: {
            $size: {
              $ifNull: ["$reviews", []],
            },
          },
 
          averageRating: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $ifNull: ["$reviews", []],
                    },
                  },
                  0,
                ],
              },
              {
                $avg: "$reviews.rating",
              },
              0,
            ],
          },
        },
      },
 
      {
        $match: {
          reviewCount: {
            $gt: 0,
          },
        },
      },
 
      {
        $sort: {
          averageRating: -1,
          reviewCount: -1,
        },
      },
 
      {
        $limit: 10,
      },
 
      {
        $project: {
          _id: 1,
          seller: 1,
          name: 1,
          description: 1,
          category: 1,
          subcategory: 1,
          subSubcategory: 1,
          media: 1,
          image: 1,
          brand: 1,
          brands: 1,
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);
 
    const convertedProducts = await convertProductsMedia(products);
 
    res.status(200).json({
      success: true,
      count: convertedProducts.length,
      products: convertedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =====================================================
   GET TOP RATED PRODUCTS
   BY SUB SUB CATEGORY
===================================================== */
 
exports.getTopRatedProductsBySubSubCategory = async (req, res) => {
  try {
    const { subSubCategoryId } = req.params;
 
    const products = await SellerInventory.aggregate([
      {
        $match: {
          subSubcategory: new mongoose.Types.ObjectId(subSubCategoryId),
          isActive: true,
        },
      },
 
      {
        $addFields: {
          reviewCount: {
            $size: {
              $ifNull: ["$reviews", []],
            },
          },
 
          averageRating: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $ifNull: ["$reviews", []],
                    },
                  },
                  0,
                ],
              },
              {
                $avg: "$reviews.rating",
              },
              0,
            ],
          },
        },
      },
 
      {
        $match: {
          reviewCount: {
            $gt: 0,
          },
        },
      },
 
      {
        $sort: {
          averageRating: -1,
          reviewCount: -1,
        },
      },
 
      {
        $limit: 10,
      },
 
      {
        $project: {
          _id: 1,
          seller: 1,
          name: 1,
          description: 1,
          category: 1,
          subcategory: 1,
          subSubcategory: 1,
          media: 1,
          image: 1,
          brand: 1,
          brands: 1,
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);
 
    const convertedProducts = await convertProductsMedia(products);
 
    res.status(200).json({
      success: true,
      count: convertedProducts.length,
      products: convertedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =====================================================
   GET TOP BRANDS BY CATEGORY
===================================================== */
 
exports.getTopBrandsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    const brands = await SellerInventory.aggregate([
      {
        $match: {
          category: new mongoose.Types.ObjectId(categoryId),
          isActive: true,
        },
      },
 
      {
        $unwind: "$brands",
      },
 
      {
        $group: {
          _id: "$brands.name",
 
          logo: {
            $first: "$brands.logo",
          },
 
          totalProducts: {
            $sum: 1,
          },
        },
      },
 
      {
        $sort: {
          totalProducts: -1,
        },
      },
 
      {
        $limit: 10,
      },
    ]);
 
    /* =====================================
       CONVERT BRAND LOGOS TO S3 URL
    ===================================== */
 
    const convertedBrands = await Promise.all(
      brands.map(async (brand) => ({
        ...brand,
        logo: await getSignedUrl(brand.logo),
      })),
    );
 
    res.status(200).json({
      success: true,
      brands: convertedBrands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 