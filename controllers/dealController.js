const Deal = require("../models/Deal");
const ProductItem = require("../models/ProductItem");

/* =========================================
   ADD DEAL
========================================= */

exports.addDeal = async (
  req,
  res
) => {
  try {

    const {
      productItem,
      type,
      startDate,
      endDate,
      discountPercentage,
    } = req.body;

    // =====================================
    // CHECK PRODUCT ITEM EXISTS
    // =====================================

    const product =
      await ProductItem.findById(
        productItem
      ).populate("sellerInventory");

    if (!product) {

      return res.status(404).json({
        success: false,
        message:
          "Product item not found",
      });

    }
     console.log(
  "PRODUCT OWNER:",
  product.sellerInventory.seller.toString()
);

console.log(
  "LOGGED USER:",
  req.user._id.toString()
);

    // =====================================
    // CHECK OWNER
    // =====================================

    if (
      product.sellerInventory.seller.toString()
      !== req.user._id.toString()
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Unauthorized to add deal",
      });

    }

    // =====================================
    // CREATE DEAL
    // =====================================

    const deal =
      await Deal.create({

        productItem,

        type,

        startDate,

        endDate,

        discountPercentage,

        isActive: true,

      });

    res.status(201).json({
      success: true,
      message:
        "Deal added successfully",
      deal,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message:
        error.message,
    });

  }
};

/* =========================================
   GET ALL DEALS
========================================= */

exports.getAllDeals =
  async (req, res) => {

    try {

      const deals =
        await Deal.find()

          .populate({
            path: "productItem",

            populate: [

              {
                path:
                  "sellerInventory",
              },

              {
                path: "category",
              },

              {
                path:
                  "subcategory",
              },

              {
                path:
                  "subSubcategory",
              },

              {
                path:
                  "productType",
              },

            ],
          });

      res.status(200).json({
        success: true,
        data: deals,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

  };

/* =========================================
   GET SINGLE DEAL
========================================= */

exports.getDealById =
  async (req, res) => {

    try {

      const deal =
        await Deal.findById(
          req.params.id
        )

          .populate({
            path: "productItem",

            populate: [

              {
                path:
                  "sellerInventory",
              },

              {
                path: "category",
              },

              {
                path:
                  "subcategory",
              },

              {
                path:
                  "subSubcategory",
              },

              {
                path:
                  "productType",
              },

            ],
          });

      if (!deal) {

        return res.status(404).json({
          success: false,
          message:
            "Deal not found",
        });

      }

      res.status(200).json({
        success: true,
        data: deal,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

  };

/* =========================================
   UPDATE DEAL
========================================= */

exports.updateDeal =
  async (req, res) => {

    try {

      const deal =
        await Deal.findById(
          req.params.id
        )

          .populate({
            path: "productItem",

            populate: {
              path:
                "sellerInventory",
            },
          });

      if (!deal) {

        return res.status(404).json({
          success: false,
          message:
            "Deal not found",
        });

      }

      // =====================================
      // CHECK OWNER
      // =====================================

      if (
        deal.productItem
          .sellerInventory
          .seller.toString()
        !== req.user._id.toString()
      ) {

        return res.status(403).json({
          success: false,
          message:
            "Unauthorized to update deal",
        });

      }

      const updatedDeal =
        await Deal.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );

      res.status(200).json({
        success: true,
        message:
          "Deal updated successfully",
        deal: updatedDeal,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

  };

/* =========================================
   DELETE DEAL
========================================= */

exports.deleteDeal =
  async (req, res) => {

    try {

      const deal =
        await Deal.findById(
          req.params.id
        )

          .populate({
            path: "productItem",

            populate: {
              path:
                "sellerInventory",
            },
          });

      if (!deal) {

        return res.status(404).json({
          success: false,
          message:
            "Deal not found",
        });

      }

      // =====================================
      // CHECK OWNER
      // =====================================

      if (
        deal.productItem
          .sellerInventory
          .seller.toString()
        !== req.user._id.toString()
      ) {

        return res.status(403).json({
          success: false,
          message:
            "Unauthorized to delete deal",
        });

      }

      await Deal.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        success: true,
        message:
          "Deal deleted successfully",
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

  };

/* =========================================
   TOP DEAL OF THE DAY
========================================= */

exports.getTopDeal =
  async (req, res) => {

    try {

      const deal =
        await Deal.findOne({

          type: "topDeal",

          isActive: true,

        })

          .populate({
            path: "productItem",

            populate: [

              {
                path:
                  "sellerInventory",
              },

              {
                path: "category",
              },

              {
                path:
                  "subcategory",
              },

              {
                path:
                  "subSubcategory",
              },

              {
                path:
                  "productType",
              },

            ],
          })

          .sort({
            createdAt: -1,
          });

      if (!deal) {

        return res.status(404).json({
          success: false,
          message:
            "No top deal found",
        });

      }

      res.status(200).json({
        success: true,
        data: deal,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

  };
 

/* =========================================
   UPCOMING DEALS
========================================= */

exports.getUpcomingDeals =
  async (req, res) => {

    try {

      const deals =
        await Deal.find({

          type: "upcoming",

          isActive: true,

        })

          .populate({
            path: "productItem",

            populate: [

              {
                path:
                  "sellerInventory",
              },

              {
                path: "category",
              },

              {
                path:
                  "subcategory",
              },

              {
                path:
                  "subSubcategory",
              },

              {
                path:
                  "productType",
              },

            ],
          });

      res.status(200).json({
        success: true,
        data: deals,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message:
          error.message,
      });

    }

  };
