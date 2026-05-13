const mongoose =
  require("mongoose");

const productTypeSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
      },

      slug: {
        type: String,
        required: true,
      },

      category: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Category",

        required: true,
      },

      subcategory: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Subcategory",
      },

      subSubcategory: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "SubSubcategory",
      },
    },

    { timestamps: true },
  );

module.exports =
  mongoose.models.ProductType ||
  mongoose.model(
    "ProductType",
    productTypeSchema,
  );