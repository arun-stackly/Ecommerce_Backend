const mongoose = require("mongoose");

const specificationTemplateSchema =
  new mongoose.Schema(
    {
      productTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductType",
        required: true,
        unique: true,
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

module.exports = mongoose.model(
  "SpecificationTemplate",
  specificationTemplateSchema
);