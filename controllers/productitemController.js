const ProductItem = require("../models/productitem");
const SellerInventory = require("../models/SellerInventory");
const ProductType =
  require("../models/ProductType");

/* =======================================
   ADD PRODUCT ITEM
======================================= */

exports.addProduct = async (
  req,
  res
) => {
  try {
    const {
      sellerInventory,
      category,
      subcategory,
      subSubcategory,
      productType,
    } = req.body;

    /* ===== CHECK INVENTORY ===== */

    const inventory =
      await SellerInventory.findById(
        sellerInventory
      );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message:
          "Seller inventory not found",
      });
    }

    /* ===== CREATE SLUG ===== */

    const slug = inventory.name
      .toLowerCase()
      .replace(/\s+/g, "-");

    /* ===== CREATE PRODUCT ITEM ===== */

    const product =
      await ProductItem.create({
        sellerInventory,
        slug,
        category,
        subcategory,
        subSubcategory,
        productType,
      });

    res.status(201).json({
      success: true,
      message:
        "Product item created successfully",
      product,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =======================================
   GET ALL PRODUCTS
======================================= */

exports.getProducts = async (
  req,
  res
) => {
  try {
    const products =
      await ProductItem.find()
        .populate({
          path: "sellerInventory",
          select:
            "name price media quantity isActive",
        })
        .populate(
 "category subcategory subSubcategory productType"
);

    res.json({
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

/* =======================================
   GET PRODUCTS BY SUB SUBCATEGORY
======================================= */

exports.getProductsBySubSubcategory =
  async (req, res) => {
    try {
      const products =
        await ProductItem.find({
          subSubcategory:
            req.params.subSubcategoryId,
        })
          .populate({
            path: "sellerInventory",
            select:
              "name price media quantity isActive",
          })
          .populate(
            "category subcategory subSubcategory"
          );

      res.json({
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

exports.getProductsByType =
  async (req, res) => {

    try {

      const { typeName } =
        req.params;

      console.log(
        "TYPE PARAM:",
        typeName,
      );

      const type =
        await ProductType.findOne({
          name: new RegExp(
            `^${typeName}$`,
            "i",
          ),
        });

      console.log(
        "FOUND TYPE:",
        type,
      );

      if (!type) {

        return res.status(404).json({
          success: false,
          message:
            "Product type not found",
        });

      }

      const products =
        await ProductItem.find({
          productType: type._id,
        })

          .populate({
            path:
              "sellerInventory",

            select:
              "name price media quantity isActive",
          })

          .populate(
            "category subcategory subSubcategory productType",
          );

      console.log(
        "FOUND PRODUCTS:",
        products,
      );

      res.json({
        success: true,
        products,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };
/* =======================================
   GET PRODUCTS BY SUBCATEGORY
======================================= */

exports.getProductsBySubcategory =
  async (req, res) => {
    try {
      const { subcategoryId } =
        req.params;

      const products =
        await ProductItem.find({
          subcategory:
            subcategoryId,
        })
          .populate({
            path: "sellerInventory",
            select:
              "name price media quantity isActive",
          })
          .populate(
            "category subcategory"
          );

      res.json({
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
   GET PRODUCTS BY TYPE + SUBSUBCATEGORY
======================================= */

exports.getProductsByTypeAndSubSubCategory =
  async (req, res) => {
    try {
      const {
        productType,
        subSubcategoryId,
      } = req.query;

      let filter = {};

      if (productType) {
        filter.productType =
          productType;
      }

      if (subSubcategoryId) {
        filter.subSubcategory =
          subSubcategoryId;
      }

      const products =
        await ProductItem.find(filter)
          .populate({
            path: "sellerInventory",
            select:
              "name price media quantity isActive",
          })
          .populate(
            "category subcategory subSubcategory"
          );

      res.json({
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

/* =======================================
   UPDATE PRODUCT ITEM
======================================= */

exports.updateProduct = async (
  req,
  res
) => {
  try {
    const product =
      await ProductItem.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product item not found",
      });
    }

    res.json({
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

/* =======================================
   DELETE PRODUCT ITEM
======================================= */

exports.deleteProduct = async (
  req,
  res
) => {
  try {
    const product =
      await ProductItem.findByIdAndDelete(
        req.params.id
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product item not found",
      });
    }

    res.json({
      success: true,
      message:
        "Product item deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};