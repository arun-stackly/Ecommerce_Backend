const ProductType =
  require("../models/ProductType");

const Category =
  require("../models/Category");

const Subcategory =
  require("../models/Subcategory");

const SubSubcategory =
  require("../models/SubSubcategory");

/* ================= CREATE PRODUCT TYPE ================= */

exports.createProductType =
  async (req, res) => {

    try {

      const {
        name,
        category,
        subcategory,
        subSubcategory,
      } = req.body;

      const slug =
        name
          .toLowerCase()
          .replace(/\s+/g, "-");

      const productType =
        await ProductType.create({

          name,

          slug,

          category,

          subcategory,

          subSubcategory,
        });

      res.status(201).json({

        success: true,

        message:
          "Product type created successfully",

        productType,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

/* ================= GET ALL PRODUCT TYPES ================= */

exports.getProductTypes =
  async (req, res) => {

    try {

      const productTypes =
        await ProductType.find()

          .populate("category")

          .populate("subcategory")

          .populate("subSubcategory");

      res.json({
        success: true,
        productTypes,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

/* ================= GET PRODUCT TYPES BY SUBCATEGORY ================= */

exports.getProductTypesBySubcategory =
  async (req, res) => {

    try {

      const productTypes =
        await ProductType.find({
          subcategory:
            req.params.subcategoryId,
        });

      res.json({
        success: true,
        productTypes,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

/* ================= UPDATE PRODUCT TYPE ================= */

exports.updateProductType =
  async (req, res) => {

    try {

      const updateData = {
        ...req.body,
      };

      if (req.body.name) {

        updateData.slug =
          req.body.name
            .toLowerCase()
            .replace(/\s+/g, "-");
      }

      const productType =
        await ProductType.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true },
        );

      res.json({
        success: true,
        productType,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

/* ================= DELETE PRODUCT TYPE ================= */

exports.deleteProductType =
  async (req, res) => {

    try {

      await ProductType.findByIdAndDelete(
        req.params.id,
      );

      res.json({
        success: true,
        message:
          "Product type deleted successfully",
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };
