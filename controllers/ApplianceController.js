const mongoose = require("mongoose");
 
const Banner = require("../models/Banner");
const SellerInventory = require("../models/SellerInventory");
 
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
 
  /* -------------------------------------------------------
     MEDIA ARRAY
  ------------------------------------------------------- */
 
  if (Array.isArray(media)) {
    return Promise.all(
      media.map(async (item) => {
        // Object format
        // {
        //   url: "products/image.jpg",
        //   type: "image"
        // }
 
        if (item && typeof item === "object" && item.url) {
          return {
            ...item,
            url: await getSignedUrl(item.url),
          };
        }
 
        // String format
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
 
  /* -------------------------------------------------------
     SINGLE MEDIA STRING
  ------------------------------------------------------- */
 
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
   GET BANNERS BY SUBCATEGORY
========================================================= */
 
exports.getBannersBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    const banners = await Banner.find({
      subcategory: subcategoryId,
      isActive: true,
    }).lean();
 
    /* -------------------------------------------------------
       CONVERT BANNER IMAGES TO S3 SIGNED URLS
    ------------------------------------------------------- */
 
    const updatedBanners = await Promise.all(
      banners.map(async (banner) => {
        return {
          ...banner,
          image: await getSignedUrl(banner.image),
        };
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedBanners.length,
      banners: updatedBanners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET BANNERS BY CATEGORY
========================================================= */
 
exports.getBannersByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    const banners = await Banner.find({
      category: categoryId,
      isActive: true,
    }).lean();
 
    /* -------------------------------------------------------
       CONVERT BANNER IMAGES TO S3 SIGNED URLS
    ------------------------------------------------------- */
 
    const updatedBanners = await Promise.all(
      banners.map(async (banner) => {
        return {
          ...banner,
          image: await getSignedUrl(banner.image),
        };
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedBanners.length,
      banners: updatedBanners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET BANNERS BY SUB SUBCATEGORY
========================================================= */
 
exports.getBannersBySubSubCategory = async (req, res) => {
  try {
    const { subSubCategoryId } = req.params;
 
    const banners = await Banner.find({
      subSubcategory: subSubCategoryId,
      isActive: true,
    }).lean();
 
    /* -------------------------------------------------------
       CONVERT BANNER IMAGES TO S3 SIGNED URLS
    ------------------------------------------------------- */
 
    const updatedBanners = await Promise.all(
      banners.map(async (banner) => {
        return {
          ...banner,
          image: await getSignedUrl(banner.image),
        };
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedBanners.length,
      banners: updatedBanners,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET TOP RATED PRODUCTS
   BY SUBCATEGORY
========================================================= */
 
exports.getTopRatedProducts = async (req, res) => {
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
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);
 
    /* -------------------------------------------------------
       CONVERT PRODUCT MEDIA TO S3 SIGNED URLS
    ------------------------------------------------------- */
 
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        return {
          ...product,
          media: await convertProductMedia(product.media),
        };
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET TOP RATED PRODUCTS
   BY CATEGORY
========================================================= */
 
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
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);
 
    /* -------------------------------------------------------
       CONVERT PRODUCT MEDIA TO S3 SIGNED URLS
    ------------------------------------------------------- */
 
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        return {
          ...product,
          media: await convertProductMedia(product.media),
        };
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET TOP RATED PRODUCTS
   BY SUB SUBCATEGORY
========================================================= */
 
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
          price: 1,
          discountPrice: 1,
          sizes: 1,
          averageRating: 1,
          reviewCount: 1,
        },
      },
    ]);
 
    /* -----------------------------------------------------
         CONVERT PRODUCT MEDIA TO S3 SIGNED URLS
      ----------------------------------------------------- */
 
    const updatedProducts = await Promise.all(
      products.map(async (product) => {
        return {
          ...product,
          media: await convertProductMedia(product.media),
        };
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET TOP BRANDS BY CATEGORY
========================================================= */
 
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
 
    /* -----------------------------------------------------
         CONVERT BRAND LOGOS TO S3 SIGNED URLS
      ----------------------------------------------------- */
 
    const updatedBrands = await Promise.all(
      brands.map(async (brand) => {
        return {
          ...brand,
 
          logo: await getSignedUrl(brand.logo),
        };
      }),
    );
 
    res.status(200).json({
      success: true,
      brands: updatedBrands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 