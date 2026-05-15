const Deal = require("../models/Deal");
const SellerInventory = require("../models/SellerInventory");

/* =========================================
   ADD DEAL
========================================= */

exports.addDeal = async (req, res) => {
  try {

    const { sellerInventoryId } =
      req.body;

    // =====================================
    // CHECK PRODUCT EXISTS
    // =====================================
    const product =
      await SellerInventory.findById(
        sellerInventoryId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Inventory product not found",
      });
    }

    // =====================================
    // AUTHORIZATION CHECK
    // ONLY PRODUCT OWNER CAN ADD DEAL
    // =====================================
    if (
      product.seller.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized to add deal for this product",
      });
    }

    // =====================================
    // CREATE DEAL
    // AUTO COPY CATEGORY/SUBCATEGORY
    // =====================================
    const deal = await Deal.create({

      ...req.body,

      category:
        product.category,

      subcategory:
        product.subcategory,

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
      message: error.message,
    });

  }
};

/* =========================================
   GET ALL DEALS
========================================= */

exports.getAllDeals = async (
  req,
  res
) => {
  try {

    const deals = await Deal.find()
      .populate({
        path: "sellerInventoryId",
        model: "SellerInventory",
      });

    res.status(200).json({
      success: true,
      data: deals,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* =========================================
   GET SINGLE DEAL
========================================= */

exports.getDealById = async (
  req,
  res
) => {
  try {

    const deal =
      await Deal.findById(
        req.params.id
      ).populate({
        path: "sellerInventoryId",
        model: "SellerInventory",
      });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    res.status(200).json({
      success: true,
      data: deal,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

exports.updateDeal = async (
  req,
  res
) => {
  try {

    const deal =
      await Deal.findById(
        req.params.id
      ).populate(
        "sellerInventoryId"
      );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // =====================================
    // CHECK PRODUCT OWNER
    // =====================================
    if (
      deal.sellerInventoryId.seller.toString()
      !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized to update this deal",
      });
    }

    // =====================================
    // UPDATE
    // =====================================
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
      message: error.message,
    });

  }
};

/* =========================================
   DELETE DEAL
========================================= */

exports.deleteDeal = async (
  req,
  res
) => {
  try {

    const deal =
      await Deal.findById(
        req.params.id
      ).populate(
        "sellerInventoryId"
      );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    // =====================================
    // CHECK OWNER
    // =====================================
    if (
      deal.sellerInventoryId.seller.toString()
      !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized to delete this deal",
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
      message: error.message,
    });

  }
};

/* =========================================
   TOP WEEKLY DEAL
========================================= */

exports.getTopWeekDeal = async (
  req,
  res
) => {
  try {

    const deal =
      await Deal.findOne({
        type: "weekly",
        isActive: true,
      }).populate({
        path: "sellerInventoryId",
        model: "SellerInventory",
      });

    res.status(200).json({
      success: true,
      data: deal,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
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
        }).populate({
          path: "sellerInventoryId",
          model: "SellerInventory",
        });

      res.status(200).json({
        success: true,
        data: deals,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };

/* =========================================
   DEALS BY BRAND
========================================= */

exports.getDealsByBrand =
  async (req, res) => {
    try {

      const { brand } =
        req.params;

      const deals =
        await Deal.find({
          isActive: true,
        }).populate({
          path:
            "sellerInventoryId",

          match: {
            "brands.name": brand,
          },
        });

      // REMOVE NULLS
      const filteredDeals =
        deals.filter(
          (deal) =>
            deal.sellerInventoryId !==
            null
        );

      res.status(200).json({
        success: true,
        data: filteredDeals,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  };