  const Deal = require("../models/Deal");
const mongoose = require("mongoose");
const SellerInventory = require("../models/SellerInventory");
 
const { getS3SignedUrl } = require("../utils/s3Helper");
 
/* ==========================================
   PRODUCT FIELDS
========================================== */
 
const PRODUCT_FIELDS =
  "name media brand price discountPrice category productType sizes";
 
/* ==========================================
   S3 MEDIA HELPER
========================================== */
 
const convertMediaToSignedUrls = async (media = []) => {
  if (!Array.isArray(media)) {
    return [];
  }
 
  return Promise.all(
    media.map(async (item) => {
      if (!item || !item.url) {
        return item;
      }
 
      try {
        return {
          ...(item.toObject?.() || item),
          url: await getS3SignedUrl(item.url),
        };
      } catch (error) {
        console.error(
          "Failed to generate S3 signed URL for media:",
          error.message,
        );
 
        return item;
      }
    }),
  );
};
 
/* ==========================================
   S3 BRAND LOGO HELPER
========================================== */
 
const convertBrandLogoToSignedUrl = async (brand) => {
  if (!brand || typeof brand !== "object") {
    return brand;
  }
 
  const brandObject = brand.toObject ? brand.toObject() : { ...brand };
 
  if (!brandObject.logo) {
    return brandObject;
  }
 
  try {
    brandObject.logo = await getS3SignedUrl(brandObject.logo);
  } catch (error) {
    console.error(
      "Failed to generate S3 signed URL for brand logo:",
      error.message,
    );
  }
 
  return brandObject;
};
 
/* ==========================================
   COMPLETE PRODUCT S3 URL CONVERSION
========================================== */
 
const convertProductS3Urls = async (product) => {
  if (!product) {
    return product;
  }
 
  const productObject = product.toObject ? product.toObject() : { ...product };
 
  /* ================= MEDIA ================= */
 
  if (productObject.media) {
    productObject.media = await convertMediaToSignedUrls(productObject.media);
  }
 
  /* ================= BRAND LOGO ================= */
 
  if (productObject.brand) {
    productObject.brand = await convertBrandLogoToSignedUrl(
      productObject.brand,
    );
  }
 
  return productObject;
};
 
/* =======================================
   1. GET PRODUCTS BY CATEGORY
======================================= */
 
exports.getCategoryProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid categoryId",
      });
    }
 
    const products = await SellerInventory.find({
      category: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
    })
      .select(PRODUCT_FIELDS)
      .populate("category", "name")
      .populate("productType", "name")
      .lean();
 
    const updatedProducts = await Promise.all(
      products.map(convertProductS3Urls),
    );
 
    res.status(200).json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    console.error("Get Category Products Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =======================================
   2. GET PRODUCTS BY PRODUCT TYPE
======================================= */
 
exports.getFilteredProducts = async (req, res) => {
  try {
    const { productTypeId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(productTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productTypeId",
      });
    }
 
    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
    })
      .select(PRODUCT_FIELDS)
      .populate("category", "name")
      .populate("productType", "name")
      .lean();
 
    const updatedProducts = await Promise.all(
      products.map(convertProductS3Urls),
    );
 
    res.status(200).json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    console.error("Get Filtered Products Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =======================================
   3. GET PRODUCTS BY SUBCATEGORY
======================================= */
 
exports.getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategoryId",
      });
    }
 
    const products = await SellerInventory.find({
      subcategory: new mongoose.Types.ObjectId(subcategoryId),
      isActive: true,
    })
      .select(PRODUCT_FIELDS)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("productType", "name")
      .lean();
 
    const updatedProducts = await Promise.all(
      products.map(convertProductS3Urls),
    );
 
    res.status(200).json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    console.error("Get Products By Subcategory Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =======================================
   4. UPCOMING DEALS
======================================= */
 
exports.getUpcomingDeals = async (req, res) => {
  try {
    const { productTypeId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(productTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productTypeId",
      });
    }
 
    /* ===============================
       GET PRODUCTS
    =============================== */
 
    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
    }).select("_id");
 
    const productIds = products.map((product) => product._id);
 
    /* ===============================
       GET DEALS
    =============================== */
 
    const deals = await Deal.find({
      type: "upcoming",
      isActive: true,
      sellerInventory: {
        $in: productIds,
      },
    })
      .populate({
        path: "sellerInventory",
        select: PRODUCT_FIELDS,
        populate: [
          {
            path: "category",
            select: "name",
          },
          {
            path: "productType",
            select: "name",
          },
        ],
      })
      .lean();
 
    /* ===============================
       CONVERT S3 URLS
    =============================== */
 
    const updatedDeals = await Promise.all(
      deals.map(async (deal) => {
        if (deal.sellerInventory) {
          deal.sellerInventory = await convertProductS3Urls(
            deal.sellerInventory,
          );
        }
 
        return deal;
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedDeals.length,
      deals: updatedDeals,
    });
  } catch (error) {
    console.error("Get Upcoming Deals Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =======================================
   5. TOP RATED PRODUCTS
======================================= */
 
exports.getTopRatedProducts = async (req, res) => {
  try {
    const { productTypeId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(productTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productTypeId",
      });
    }
 
    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
    })
      .select("name media brand price discountPrice sizes category reviews")
      .populate("category", "name")
      .lean();
 
    const productsWithRating = products
      .map((product) => {
        const totalReviews = Array.isArray(product.reviews)
          ? product.reviews.length
          : 0;
 
        const avgRating =
          totalReviews === 0
            ? 0
            : product.reviews.reduce(
                (acc, review) => acc + Number(review.rating || 0),
                0,
              ) / totalReviews;
 
        return {
          ...product,
 
          sizes: product.sizes || [],
 
          avgRating: Number(avgRating.toFixed(1)),
 
          reviewCount: totalReviews,
        };
      })
      .filter((product) => product.reviewCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);
 
    /* ===============================
       CONVERT S3 URLS
    =============================== */
 
    const updatedProducts = await Promise.all(
      productsWithRating.map(convertProductS3Urls),
    );
 
    res.status(200).json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    console.error("Get Top Rated Products Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =======================================
   6. TOP RATED PRODUCTS BY SUBCATEGORY
======================================= */
 
exports.getTopRatedProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategoryId",
      });
    }
 
    const products = await SellerInventory.find({
      subcategory: new mongoose.Types.ObjectId(subcategoryId),
      isActive: true,
    })
      .select("name media brand price discountPrice category sizes reviews")
      .populate("category", "name")
      .populate("subcategory", "name")
      .lean();
 
    const productsWithRating = products
      .map((product) => {
        const totalReviews = Array.isArray(product.reviews)
          ? product.reviews.length
          : 0;
 
        const avgRating =
          totalReviews === 0
            ? 0
            : product.reviews.reduce(
                (acc, review) => acc + Number(review.rating || 0),
                0,
              ) / totalReviews;
 
        return {
          ...product,
 
          sizes: product.sizes || [],
 
          avgRating: Number(avgRating.toFixed(1)),
 
          reviewCount: totalReviews,
        };
      })
      .filter((product) => product.reviewCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);
 
    /* ===============================
         CONVERT S3 URLS
      =============================== */
 
    const updatedProducts = await Promise.all(
      productsWithRating.map(convertProductS3Urls),
    );
 
    res.status(200).json({
      success: true,
      count: updatedProducts.length,
      products: updatedProducts,
    });
  } catch (error) {
    console.error("Get Top Rated Products By Subcategory Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =======================================
   7. GET BRANDS BY PRODUCT TYPE
======================================= */
 
exports.getBrandsByProductType = async (req, res) => {
  try {
    const { productTypeId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(productTypeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid productTypeId",
      });
    }
 
    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
    })
      .select("brand")
      .lean();
 
    const brandsMap = {};
 
    for (const product of products) {
      const brandName = product.brand?.name?.trim();
 
      if (!brandName) {
        continue;
      }
 
      if (!brandsMap[brandName]) {
        brandsMap[brandName] = {
          name: brandName,
          logo: product.brand?.logo || "",
          count: 1,
        };
      } else {
        brandsMap[brandName].count += 1;
      }
    }
 
    const brands = Object.values(brandsMap);
 
    /* ===============================
       CONVERT BRAND LOGOS TO S3 URL
    =============================== */
 
    const updatedBrands = await Promise.all(
      brands.map(async (brand) => {
        if (brand.logo) {
          try {
            brand.logo = await getS3SignedUrl(brand.logo);
          } catch (error) {
            console.error("Brand Logo S3 URL Error:", error.message);
          }
        }
 
        return brand;
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedBrands.length,
      brands: updatedBrands,
    });
  } catch (error) {
    console.error("Get Brands By Product Type Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =======================================
   8. GET BRANDS BY SUBCATEGORY
======================================= */
 
exports.getBrandsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategoryId",
      });
    }
 
    const products = await SellerInventory.find({
      subcategory: new mongoose.Types.ObjectId(subcategoryId),
      isActive: true,
    })
      .select("brand")
      .lean();
 
    const brandsMap = {};
 
    for (const product of products) {
      const brandName = product.brand?.name?.trim();
 
      if (!brandName) {
        continue;
      }
 
      if (!brandsMap[brandName]) {
        brandsMap[brandName] = {
          name: brandName,
          logo: product.brand?.logo || "",
          count: 1,
        };
      } else {
        brandsMap[brandName].count += 1;
      }
    }
 
    const brands = Object.values(brandsMap);
 
    /* ===============================
       CONVERT BRAND LOGOS TO S3 URL
    =============================== */
 
    const updatedBrands = await Promise.all(
      brands.map(async (brand) => {
        if (brand.logo) {
          try {
            brand.logo = await getS3SignedUrl(brand.logo);
          } catch (error) {
            console.error("Brand Logo S3 URL Error:", error.message);
          }
        }
 
        return brand;
      }),
    );
 
    res.status(200).json({
      success: true,
      count: updatedBrands.length,
      brands: updatedBrands,
    });
  } catch (error) {
    console.error("Get Brands By Subcategory Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 