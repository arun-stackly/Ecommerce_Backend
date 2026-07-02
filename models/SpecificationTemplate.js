const mongoose = require("mongoose");

const specificationTemplateSchema =
  new mongoose.Schema(
    {
      productTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductType",
        default: null,
      },

      subSubCategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSubcategory",
        default: null,
      },

      specifications: {
        type: Object,
        default: {},
      },
    },
    {
      timestamps: true,
    }
  );

// Prevent duplicate templates
specificationTemplateSchema.index(
  { productTypeId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      productTypeId: { $exists: true, $ne: null },
    },
  }
);

specificationTemplateSchema.index(
  { subSubCategoryId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      subSubCategoryId: { $exists: true, $ne: null },
    },
  }
);

module.exports = mongoose.model(
  "SpecificationTemplate",
  specificationTemplateSchema
);