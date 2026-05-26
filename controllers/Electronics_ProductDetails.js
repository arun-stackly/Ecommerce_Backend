const SellerInventory = require("../models/SellerInventory");
const Deal = require("../models/Deal");
const mongoose = require("mongoose");
const ProductItem = require("../models/productitem");

/* =========================================
   GET SIMILAR PRODUCTS (STRICT CATEGORY)
   GET /api/products/:id/similar?producttypeId=xxx
========================================= */


exports.getSimilarProducts = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const { productType } = req.query;

    /* =========================
       Validate productType
    ========================= */

    if (!productType) {
      return res.status(400).json({
        success: false,
        message: "productType is required",
      });
    }

    /* =========================
       Find current product
    ========================= */

    const currentProduct =
      await SellerInventory.findById(
        inventoryId
      );

    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* =========================
       Find ProductItems
    ========================= */

    const productItems =
      await ProductItem.find({
        productType: productType,
      }).populate({
        path: "sellerInventory",
        match: {
          _id: { $ne: inventoryId },
          isActive: true,
        },
      });

    /* =========================
       Remove null values
    ========================= */

    const similarProducts =
      productItems
        .filter(
          (item) => item.sellerInventory
        )
        .map(
          (item) => item.sellerInventory
        );

    /* =========================
       Response
    ========================= */

    res.status(200).json({
      success: true,
      count: similarProducts.length,
      products: similarProducts,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   SEARCH PRODUCTS
   GET /api/products/search?q=shirt
========================================= */
exports.searchProducts = async (
  req,
  res,
) => {
  try {
    const q = req.query.q;

    const products =
      await SellerInventory.find({
        name: {
          $regex: q,
          $options: "i",
        },

        isActive: true,
      });

    res.status(200).json({
      success: true,
      products,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET ALL DEALS
   GET /api/deals
========================================= */
exports.getAllDeals = async (req, res) => {
  try {

    const deals = await Deal.find({
      isActive: true,
    }).populate({
      path: "productItem",
      model: "ProductItem",
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

/* =========================================
   GET SINGLE PRODUCT
   GET /api/products/:id
========================================= */
exports.getProductById = async (
  req,
  res,
) => {
  try {
    const product =
      await SellerInventory.findById(
        req.params.id,
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });

  } catch (error) {
    res.status(500).json({
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