const Deal = require("../models/Deal");
const mongoose = require("mongoose");
const SellerInventory = require("../models/SellerInventory");

const PRODUCT_FIELDS =
  "name media brand price discountPrice category productType";

/* =======================================
   1. Get Products By Category
======================================= */
exports.getCategoryProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await SellerInventory.find({
      category: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
    })
      .select(PRODUCT_FIELDS)
      .populate("category", "name");

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   2. Get Products By Product Type
======================================= */
exports.getFilteredProducts = async (req, res) => {
  try {
    const { productTypeId } = req.params;

    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
    })
      .select(PRODUCT_FIELDS)
      .populate("category", "name");

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   3. Upcoming Deals
======================================= */
exports.getUpcomingDeals = async (req, res) => {
  try {
    const { productTypeId } = req.params;

    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
    }).select("_id");

    const productIds = products.map(
      (product) => product._id
    );

    const deals = await Deal.find({
      type: "upcoming",
      isActive: true,
      sellerInventory: {
        $in: productIds,
      },
    }).populate({
      path: "sellerInventory",
      select: PRODUCT_FIELDS,
      populate: {
        path: "category",
        select: "name",
      },
    });

    res.status(200).json({
      success: true,
      count: deals.length,
      deals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   4. Top Rated Products
======================================= */
exports.getTopRatedProducts = async (req, res) => {
  try {
    const { productTypeId } = req.params;

    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
    })
      .select(
        "name media brand price discountPrice category reviews"
      )
      .populate("category", "name");

    const productsWithRating = products
      .map((product) => {
        const totalReviews =
          product.reviews?.length || 0;

        const avgRating =
          totalReviews === 0
            ? 0
            : product.reviews.reduce(
                (acc, review) =>
                  acc + review.rating,
                0
              ) / totalReviews;

        return {
          _id: product._id,
          name: product.name,
          media: product.media,
          brand: product.brand,
          price: product.price,
          discountPrice: product.discountPrice,
          category: product.category,
          avgRating: Number(
            avgRating.toFixed(1)
          ),
          reviewCount: totalReviews,
        };
      })
      .filter(
        (product) =>
          product.reviewCount > 0
      )
      .sort(
        (a, b) =>
          b.avgRating - a.avgRating
      )
      .slice(0, 10);

    res.status(200).json({
      success: true,
      count:
        productsWithRating.length,
      products:
        productsWithRating,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   5. Get Brands By Product Type
======================================= */
exports.getBrandsByProductType = async (req, res) => {
  try {
    const { productTypeId } = req.params;

    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
    }).select("brand");

    const brandsMap = {};

    products.forEach((product) => {
      const brandName =
        product.brand?.name?.trim();

      if (!brandName) return;

      if (!brandsMap[brandName]) {
        brandsMap[brandName] = {
          name: brandName,
          logo:
            product.brand?.logo || "",
          count: 1,
        };
      } else {
        brandsMap[brandName].count += 1;
      }
    });

    const brands =
      Object.values(brandsMap);

    res.status(200).json({
      success: true,
      count: brands.length,
      brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};