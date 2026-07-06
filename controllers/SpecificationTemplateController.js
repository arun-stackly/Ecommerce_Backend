const ProductType = require("../models/ProductType");
const SubSubCategory = require("../models/SubSubcategory");
const SpecificationTemplate = require(
  "../models/SpecificationTemplate"
);

exports.addTemplate = async (req, res) => {
  try {
    const {
      productTypeId,
      subSubCategoryId,
      specifications,
    } = req.body;

    if (!productTypeId && !subSubCategoryId) {
      return res.status(400).json({
        success: false,
        message:
          "Either productTypeId or subSubCategoryId is required",
      });
    }

    if (productTypeId) {
      const productType = await ProductType.findById(productTypeId);

      if (!productType) {
        return res.status(404).json({
          success: false,
          message: "Product Type not found",
        });
      }
    }

    if (subSubCategoryId) {
      const subSubCategory =
        await SubSubCategory.findById(subSubCategoryId);

      if (!subSubCategory) {
        return res.status(404).json({
          success: false,
          message: "SubSubCategory not found",
        });
      }
    }

    const existing = await SpecificationTemplate.findOne({
      ...(productTypeId && { productTypeId }),
      ...(subSubCategoryId && { subSubCategoryId }),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Template already exists",
      });
    }

    const template = await SpecificationTemplate.create({
      productTypeId,
      subSubCategoryId,
      specifications,
    });

    res.status(201).json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getTemplate = async (req, res) => {
  try {
    const { productTypeId, subSubCategoryId } = req.query;

    // At least one parameter is required
    if (!productTypeId && !subSubCategoryId) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide either productTypeId or subSubCategoryId.",
      });
    }

    const filter = {};

    if (productTypeId) {
      filter.productTypeId = productTypeId;
    }

    if (subSubCategoryId) {
      filter.subSubCategoryId = subSubCategoryId;
    }

    const template = await SpecificationTemplate.findOne(filter)
      .populate("productTypeId", "name slug")
      .populate("subSubCategoryId", "name slug");

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    return res.status(200).json({
      success: true,
      template,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateTemplate = async (req, res) => {
  try {
    const {
      productTypeId,
      subSubCategoryId,
      specifications,
    } = req.body;

    const filter = {};

    if (productTypeId)
      filter.productTypeId = productTypeId;

    if (subSubCategoryId)
      filter.subSubCategoryId = subSubCategoryId;

    const template =
      await SpecificationTemplate.findOneAndUpdate(
        filter,
        { specifications },
        { new: true }
      );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      template,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteTemplate = async (req, res) => {
  try {
    const { productTypeId, subSubCategoryId } = req.query;

    const filter = {};

    if (productTypeId)
      filter.productTypeId = productTypeId;

    if (subSubCategoryId)
      filter.subSubCategoryId = subSubCategoryId;

    const template =
      await SpecificationTemplate.findOneAndDelete(filter);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getAllTemplates = async (req, res) => {
  try {
    const templates =
      await SpecificationTemplate.find()
        .populate("productTypeId", "name slug")
        .populate("subSubCategoryId", "name slug")
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: templates.length,
      templates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};