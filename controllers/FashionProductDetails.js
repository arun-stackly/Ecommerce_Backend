const SellerInventory = require("../models/SellerInventory");
const Deal = require("../models/Deal");
const mongoose = require("mongoose");
const ProductItem = require("../models/productitem");

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

    const similarProducts = await SellerInventory.find({
      productType: currentProduct.productType,
      isActive: true,
      _id: { $ne: currentProduct._id },
    })
      .select(
        "name price discountPrice brand media rating "
      )
      .sort({ createdAt: -1 })
      .limit(8);

    const formatted = similarProducts.map((p) => {
      const price = p.price || 0;
      const discountPrice =
        p.discountPrice > 0 ? p.discountPrice : price;

      const discountPercentage =
        price > discountPrice
          ? Math.round(
              ((price - discountPrice) / price) * 100
            )
          : 0;

      return {
        _id: p._id,
        name: p.name,

        // Price Details
        price,
        discountPrice,
        discountPercentage,

        // Rating Details
        Rating: p.rating || 0,
       

        // Brand & Image
        brand: p.brand || null,
        image: p.media?.[0]?.url || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      products: formatted,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.searchProducts = async (req, res) => {
  try {
    const q = req.query.q;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const products = await SellerInventory.find({
      name: { $regex: q, $options: "i" },
      isActive: true,
    })
      .select("name price discountPrice brand media") // ✅ minimize DB data
      
    const formatted = products.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice || p.price,
       brand: p.brand || null,   // ✅ keep full object
      image: p.media?.[0]?.url || null,
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      products: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================
   GET SINGLE PRODUCT
   GET /api/products/:id
========================================= */

exports.getProductById = async (req, res) => {
  try {
    const product = await SellerInventory.findById(req.params.id)
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

    // ==========================
    // RATING DISTRIBUTION
    // ==========================

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    let totalRating = 0;

    product.reviews.forEach((review) => {
      const rating = Math.round(review.rating);

      if (distribution[rating] !== undefined) {
        distribution[rating]++;
      }

      totalRating += review.rating;
    });

    const reviewCount = product.reviews.length;

    const ratingDistribution = {};

    [5, 4, 3, 2, 1].forEach((star) => {
      ratingDistribution[star] = {
        count: distribution[star],
        percentage:
          reviewCount > 0
            ? Number(
                ((distribution[star] / reviewCount) * 100).toFixed(1)
              )
            : 0,
      };
    });

    // Hide reviews only in response
    const productResponse = product.toObject();
    delete productResponse.reviews;

    return res.status(200).json({
      success: true,
      product: productResponse,
      ratingDistribution,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET PRODUCT STOCK
   GET /api/products/:id/stock
========================================= */
exports.getProductStock = async (
  req,
  res,
) => {
  try {
    const inventory =
      await SellerInventory.findById(
        req.params.id,
      ).select(
        "quantity isActive",
      );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,

      stock: {
        quantity:
          inventory.quantity,

        available:
          inventory.quantity > 0 &&
          inventory.isActive,
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.checkDelivery = async (req, res) => {
  try {
    const { pincode, productId } = req.query;

    // =========================
    // VALIDATION
    // =========================
    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required",
      });
    }

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "ProductId is required",
      });
    }

    // =========================
    // PINCODE VALIDATION
    // =========================
    const isValid = /^[1-9][0-9]{5}$/.test(pincode);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode",
      });
    }

    // =========================
    // FIND PRODUCT
    // =========================
    const product = await SellerInventory.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // =========================
    // DELIVERY LOGIC
    // =========================

    const now = new Date();

    // cutoff time (you can make dynamic later)
    const cutoffTime = "1:07 PM";

    // delivery rules based on pincode
    let minDays = 2;
    let maxDays = 4;

    const firstDigit = pincode.charAt(0);

    if (["6", "7", "8", "9"].includes(firstDigit)) {
      minDays = 2;
      maxDays = 4;
    } else {
      minDays = 4;
      maxDays = 7;
    }

    // estimated delivery date
    const deliveryDate = new Date();
    deliveryDate.setDate(now.getDate() + maxDays);

    // format date like "24 Dec, Wednesday"
    const formattedDate = deliveryDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      weekday: "long",
    });

    // =========================
    // RESPONSE
    // =========================
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
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};