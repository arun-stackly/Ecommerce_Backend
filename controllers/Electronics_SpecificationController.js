// controllers/Electronics_ProductDetails.js

const SellerInventory = require("../models/SellerInventory");

const Specification = require("../models/ProductSpecification");

/* =========================================
   GET PRODUCT BY ID
   GET /api/products/:id
========================================= */

exports.getProductById = async (
  req,
  res,
) => {
  try {

    const product =
      await SellerInventory.findById(
        req.params.id
      )

      .populate(
        "seller",
        "name email"
      )

      
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* =========================
       MINIMIZED RESPONSE
    ========================= */

    const response = {
      _id: product._id,

      name: product.name,

      description:
        product.description,

      price: product.price,

      quantity:
        product.quantity,

      rating:
        product.rating,

      reviewCount:
        product.reviewCount,

      media:
        product.media,

      brands:
        product.brands,

      colours:
        product.colours,

      sizes:
        product.sizes,

      countryOfOrigin:
        product.countryOfOrigin,

      isFeatured:
        product.isFeatured,

      isActive:
        product.isActive,

      seller:
        product.seller,

      category:
        product.category,

      subcategory:
        product.subcategory,

      subSubcategory:
        product.subSubcategory,
    };

    res.status(200).json({
      success: true,

      product: response,
    });

  } catch (error) {

    res.status(500).json({
      success: false,

      message: error.message,
    });

  }
};

/* =========================================
   GET PRODUCT SPECIFICATIONS
   GET /api/productspecs/:sellerInventoryId
========================================= */

exports.getProductSpecifications =
  async (req, res) => {

    try {

      const {
        sellerInventoryId,
      } = req.params;

      /* =========================
         FIND SPECIFICATIONS
      ========================= */

      const specification =
        await Specification.findOne({
          sellerInventoryId,
        });

      if (!specification) {

        return res.status(404).json({
          success: false,

          message:
            "Specifications not found",
        });
      }

      res.status(200).json({
        success: true,

        specifications:
          specification.specifications,
      });

    } catch (error) {

      res.status(500).json({
        success: false,

        message: error.message,
      });

    }
  };