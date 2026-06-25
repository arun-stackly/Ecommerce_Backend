const SpecificationTemplate = require(
  "../models/SpecificationTemplate"
);

const ProductType = require(
  "../models/ProductType"
);

/* ==============================
   ADD TEMPLATE
============================== */

exports.addTemplate = async (
  req,
  res
) => {
  try {
    const { productTypeId } =
      req.params;

    const { specifications } =
      req.body;

    const productType =
      await ProductType.findById(
        productTypeId
      );

    if (!productType) {
      return res.status(404).json({
        success: false,
        message:
          "Product type not found",
      });
    }

    const existing =
      await SpecificationTemplate.findOne(
        {
          productTypeId,
        }
      );

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Template already exists",
      });
    }

    const template =
      await SpecificationTemplate.create(
        {
          productTypeId,
          specifications,
        }
      );

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

/* ==============================
   GET TEMPLATE
============================== */

exports.getTemplate =
  async (req, res) => {
    try {
      const { productTypeId } =
        req.params;

      const template =
        await SpecificationTemplate.findOne(
          {
            productTypeId,
          }
        ).populate(
          "productTypeId",
          "name slug"
        );

      if (!template) {
        return res.status(404).json({
          success: false,
          message:
            "Template not found",
        });
      }

      res.status(200).json({
        success: true,

        productType:
          template.productTypeId,

        specifications:
          template.specifications,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

/* ==============================
   UPDATE TEMPLATE
============================== */

exports.updateTemplate =
  async (req, res) => {
    try {
      const { productTypeId } =
        req.params;

      const { specifications } =
        req.body;

      const template =
        await SpecificationTemplate.findOneAndUpdate(
          {
            productTypeId,
          },
          {
            specifications,
          },
          {
            new: true,
          }
        );

      if (!template) {
        return res.status(404).json({
          success: false,
          message:
            "Template not found",
        });
      }

      res.status(200).json({
        success: true,
        template,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

/* ==============================
   DELETE TEMPLATE
============================== */

exports.deleteTemplate =
  async (req, res) => {
    try {
      const { productTypeId } =
        req.params;

      const template =
        await SpecificationTemplate.findOneAndDelete(
          {
            productTypeId,
          }
        );

      if (!template) {
        return res.status(404).json({
          success: false,
          message:
            "Template not found",
        });
      }

      res.status(200).json({
        success: true,
        message:
          "Template deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };

/* ==============================
   GET ALL TEMPLATES
============================== */

exports.getAllTemplates =
  async (req, res) => {
    try {
      const templates =
        await SpecificationTemplate.find()
          .populate(
            "productTypeId",
            "name slug"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,
        count: templates.length,
        templates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };