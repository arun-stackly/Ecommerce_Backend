const SellerInventory =
  require("../models/SellerInventory");

/* =====================================================
   GET PRODUCT BY ID
===================================================== */

exports.getProductById =
  async (req, res) => {

    try {

      const { SellerInventoryId } =
        req.params;

      const product =
        await SellerInventory.findById(
          SellerInventoryId
        )

          .populate("category")
.populate("subcategory")
.populate("subSubcategory")

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
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

/* =====================================================
   GET PRODUCT REVIEWS
===================================================== */

exports.getProductReviews =
  async (req, res) => {

    try {

      const { SellerInventoryId } =
        req.params;

      const product =
        await SellerInventory.findById(
          SellerInventoryId
        ).select(
          "reviews averageRating"
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      res.status(200).json({
        success: true,

        averageRating:
          product.averageRating,

        totalReviews:
          product.reviews.length,

        reviews:
          product.reviews,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
};

/* =====================================================
   GET SIMILAR PRODUCTS
===================================================== */

exports.getSimilarProducts =
  async (req, res) => {

    try {

      const { SellerInventoryId } =
        req.params;

      // current product
      const currentProduct =
        await SellerInventory.findById(
          SellerInventoryId
        );

      if (!currentProduct) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found",
        });
      }

      // similar products
      const similarProducts =
        await SellerInventory.find({

          _id: {
            $ne: SellerInventoryId,
          },

          category:
            currentProduct.category,

          subcategory:
            currentProduct.subcategory,

          isActive: true,
        })

          .select(
            "_id name media price averageRating"
          )

          .limit(10);

      res.status(200).json({
        success: true,

        count:
          similarProducts.length,

        products:
          similarProducts,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
};