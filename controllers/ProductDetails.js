const SellerInventory = require("../models/SellerInventory");
const Subcategory = require("../models/Subcategory");
const { getS3SignedUrl } = require("../utils/s3Helper");
 
/* =========================================================
   S3 SIGNED URL HELPER
========================================================= */
 
const getSignedUrl = async (value) => {
  if (!value) return null;
 
  try {
    if (typeof value !== "string") {
      return value;
    }
 
    // Keep existing HTTP/HTTPS URLs
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
 
    // Keep base64/data URLs
    if (value.startsWith("data:")) {
      return value;
    }
 
    // Otherwise treat it as an S3 key
    return await getS3SignedUrl(value);
  } catch (error) {
    console.error("S3 signed URL error:", error.message);
    return null;
  }
};
 
/* =========================================================
   CONVERT MEDIA
========================================================= */
 
const convertMedia = async (media) => {
  if (!Array.isArray(media)) {
    return [];
  }
 
  return Promise.all(
    media.map(async (item) => {
      if (!item) {
        return item;
      }
 
      // If media is stored as a string
      if (typeof item === "string") {
        return await getSignedUrl(item);
      }
 
      const converted = {
        ...item,
      };
 
      if (converted.url) {
        converted.url = await getSignedUrl(converted.url);
      }
 
      if (converted.image) {
        converted.image = await getSignedUrl(converted.image);
      }
 
      return converted;
    }),
  );
};
 
/* =========================================================
   CONVERT BRAND
========================================================= */
 
const convertBrand = async (brand) => {
  if (!brand) {
    return brand;
  }
 
  // Brand may sometimes be a string
  if (typeof brand === "string") {
    return brand;
  }
 
  const converted = {
    ...brand,
  };
 
  if (converted.logo) {
    converted.logo = await getSignedUrl(converted.logo);
  }
 
  if (converted.image) {
    converted.image = await getSignedUrl(converted.image);
  }
 
  return converted;
};
 
/* =========================================================
   CONVERT REVIEW IMAGES
========================================================= */
 
const convertReviews = async (reviews) => {
  if (!Array.isArray(reviews)) {
    return [];
  }
 
  return Promise.all(
    reviews.map(async (review) => {
      const convertedReview = {
        ...review,
      };
 
      if (Array.isArray(convertedReview.images)) {
        convertedReview.images = await Promise.all(
          convertedReview.images.map(async (image) => {
            return await getSignedUrl(image);
          }),
        );
      }
 
      return convertedReview;
    }),
  );
};
 
/* =========================================================
   CONVERT COMPLETE PRODUCT S3 MEDIA
========================================================= */
 
const convertProductS3 = async (product) => {
  if (!product) {
    return null;
  }
 
  const converted = {
    ...product,
  };
 
  // Product media
  if (Array.isArray(converted.media)) {
    converted.media = await convertMedia(converted.media);
  }
 
  // Brand
  if (converted.brand) {
    converted.brand = await convertBrand(converted.brand);
  }
 
  // Support old "brands" field if existing documents contain it
  if (Array.isArray(converted.brands)) {
    converted.brands = await Promise.all(
      converted.brands.map(async (brand) => {
        return await convertBrand(brand);
      }),
    );
  }
 
  // Review images
  if (Array.isArray(converted.reviews)) {
    converted.reviews = await convertReviews(converted.reviews);
  }
 
  return converted;
};
 
/* =========================================================
   GET PRODUCT BY ID
   GET /api/electronics/productdetails/:id
========================================================= */
 
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
 
    const product = await SellerInventory.findById(id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .populate("productType", "name");
 
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
 
    /* =====================================================
       RATING DISTRIBUTION
    ===================================================== */
 
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
 
    if (Array.isArray(product.reviews)) {
      product.reviews.forEach((review) => {
        const rating = Math.round(Number(review.rating));
 
        if (distribution[rating] !== undefined) {
          distribution[rating]++;
        }
      });
    }
 
    const reviewCount = product.reviews?.length || 0;
 
    const ratingDistribution = {};
 
    [1, 2, 3, 4, 5].forEach((star) => {
      ratingDistribution[star] = {
        count: distribution[star],
        percentage:
          reviewCount > 0
            ? Number(((distribution[star] / reviewCount) * 100).toFixed(1))
            : 0,
      };
    });
 
    /* =====================================================
       PRODUCT RESPONSE
    ===================================================== */
 
    const productResponse = product.toObject();
 
    /*
      Keep reviews in response because review images
      may also need S3 signed URLs.
    */
 
    const convertedProduct = await convertProductS3(productResponse);
 
    return res.status(200).json({
      success: true,
      product: convertedProduct,
      ratingDistribution,
    });
  } catch (error) {
    console.error("Get Product By ID Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET SIMILAR PRODUCTS
   GET /api/electronics/productdetails/:id/similar
========================================================= */
 
exports.getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
 
    const currentProduct = await SellerInventory.findById(id);
 
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
 
    /* =====================================================
       FIND SIMILAR PRODUCTS
    ===================================================== */
 
    const filter = {
      _id: {
        $ne: currentProduct._id,
      },
      isActive: true,
    };
 
    if (currentProduct.productType) {
      filter.productType = currentProduct.productType;
    } else if (currentProduct.subSubcategory) {
      filter.subSubcategory = currentProduct.subSubcategory;
    } else if (currentProduct.subcategory) {
      filter.subcategory = currentProduct.subcategory;
    } else if (currentProduct.category) {
      filter.category = currentProduct.category;
    }
 
    const similarProducts = await SellerInventory.find(filter)
      .select(
        "name media price discountPrice rating reviewCount brand brands productType subSubcategory",
      )
      .sort({
        createdAt: -1,
      })
      .limit(8);
 
    /* =====================================================
       CONVERT PRODUCTS
    ===================================================== */
 
    const products = await Promise.all(
      similarProducts.map(async (product) => {
        const productObject = product.toObject();
 
        const convertedProduct = await convertProductS3(productObject);
 
        const price = Number(convertedProduct.price || 0);
 
        const discountPrice = Number(convertedProduct.discountPrice || 0);
 
        let discountPercentage = 0;
 
        if (price > 0 && discountPrice > 0 && price > discountPrice) {
          discountPercentage = Math.round(
            ((price - discountPrice) / price) * 100,
          );
        }
 
        return {
          _id: convertedProduct._id,
          name: convertedProduct.name,
          price: convertedProduct.price,
          discountPrice: convertedProduct.discountPrice,
          discountPercentage,
          rating: convertedProduct.rating || 0,
          reviewCount: convertedProduct.reviewCount || 0,
          brand: convertedProduct.brand || convertedProduct.brands || null,
          productType: convertedProduct.productType || null,
          subSubcategory: convertedProduct.subSubcategory || null,
          media: convertedProduct.media || [],
          image:
            convertedProduct.media?.find((item) => item.type === "image")
              ?.url || null,
        };
      }),
    );
 
    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get Similar Products Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   SEARCH PRODUCTS
   GET /api/electronics/productdetails/search?q=iphone
========================================================= */
 
exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q?.trim();
 
    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }
 
    /* =====================================================
       SEARCH SUBCATEGORIES
    ===================================================== */
 
    const subcategories = await Subcategory.find({
      name: {
        $regex: q,
        $options: "i",
      },
      isActive: true,
    }).select("_id name");
 
    const subcategoryIds = subcategories.map((subcategory) => subcategory._id);
 
    /* =====================================================
       SEARCH PRODUCTS
    ===================================================== */
 
    const products = await SellerInventory.find({
      isActive: true,
      $or: [
        {
          name: {
            $regex: q,
            $options: "i",
          },
        },
        {
          "brand.name": {
            $regex: q,
            $options: "i",
          },
        },
        {
          "brands.name": {
            $regex: q,
            $options: "i",
          },
        },
        {
          subcategory: {
            $in: subcategoryIds,
          },
        },
      ],
    })
      .select(
        "name price discountPrice brand brands subcategory media rating reviewCount",
      )
      .populate("subcategory", "name");
 
    /* =====================================================
       FORMAT SEARCH RESULTS
    ===================================================== */
 
    const formattedProducts = await Promise.all(
      products.map(async (product) => {
        const productObject = product.toObject();
 
        const convertedProduct = await convertProductS3(productObject);
 
        const firstImage =
          convertedProduct.media?.find((item) => item.type === "image")?.url ||
          null;
 
        const price = Number(convertedProduct.price || 0);
 
        const discountPrice = Number(convertedProduct.discountPrice || 0);
 
        let discountPercentage = 0;
 
        if (price > 0 && discountPrice > 0 && price > discountPrice) {
          discountPercentage = Math.round(
            ((price - discountPrice) / price) * 100,
          );
        }
 
        return {
          _id: convertedProduct._id,
          name: convertedProduct.name,
          price: convertedProduct.price,
          discountPrice: convertedProduct.discountPrice,
          discountPercentage,
          rating: convertedProduct.rating || 0,
          reviewCount: convertedProduct.reviewCount || 0,
          brand: convertedProduct.brand || convertedProduct.brands || null,
          subcategory: convertedProduct.subcategory || null,
          media: convertedProduct.media || [],
          image: firstImage,
        };
      }),
    );
 
    return res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    console.error("Search Products Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   GET PRODUCT STOCK
   GET /api/electronics/productdetails/:id/stock
========================================================= */
 
exports.getProductStock = async (req, res) => {
  try {
    const { id } = req.params;
 
    const inventory =
      await SellerInventory.findById(id).select("quantity isActive");
 
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
 
    const quantity = Number(inventory.quantity || 0);
 
    return res.status(200).json({
      success: true,
      stock: {
        quantity,
        available: quantity > 0 && inventory.isActive === true,
      },
    });
  } catch (error) {
    console.error("Get Product Stock Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   CHECK DELIVERY
   GET /api/electronics/productdetails/check
   ?pincode=600001&productId=PRODUCT_ID
========================================================= */
 
exports.checkDelivery = async (req, res) => {
  try {
    const { pincode, productId } = req.query;
 
    /* =====================================================
       VALIDATE PINCODE
    ===================================================== */
 
    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required",
      });
    }
 
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 6-digit pincode",
      });
    }
 
    /* =====================================================
       VALIDATE PRODUCT
    ===================================================== */
 
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }
 
    const product = await SellerInventory.findById(productId).select(
      "_id name quantity isActive",
    );
 
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
 
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "This product is currently unavailable",
      });
    }
 
    if (Number(product.quantity || 0) <= 0) {
      return res.status(400).json({
        success: false,
        message: "This product is currently out of stock",
      });
    }
 
    /* =====================================================
       DELIVERY CALCULATION
    ===================================================== */
 
    const now = new Date();
 
    const cutoffTime = "1:07 PM";
 
    let minDays = 2;
    let maxDays = 4;
 
    /*
      Existing delivery logic preserved.
    */
 
    if (["6", "7", "8", "9"].includes(pincode.charAt(0))) {
      minDays = 2;
      maxDays = 4;
    } else {
      minDays = 4;
      maxDays = 7;
    }
 
    const deliveryDate = new Date(now);
 
    deliveryDate.setDate(deliveryDate.getDate() + maxDays);
 
    const formattedDate = deliveryDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      weekday: "long",
    });
 
    /* =====================================================
       RESPONSE
    ===================================================== */
 
    return res.status(200).json({
      success: true,
      pincode,
      serviceable: true,
 
      delivery: {
        title: "When will I receive my order",
 
        estimatedDeliveryText: `Secure delivery by ${formattedDate}`,
 
        cutoffText: `If ordered before ${cutoffTime}`,
 
        estimatedDeliveryDate: deliveryDate.toISOString().split("T")[0],
 
        deliveryDays: `${minDays}-${maxDays} days`,
      },
 
      shipping: {
        isFreeShipping: true,
        message: "Free Shipping on orders above INR 699",
        minOrderValue: 699,
      },
    });
  } catch (error) {
    console.error("Check Delivery Error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 