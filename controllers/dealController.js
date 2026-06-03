const Deal = require("../models/Deal");
const SellerInventory = require("../models/SellerInventory");

/* =========================================
   ADD DEAL
========================================= */
exports.addDeal = async (req, res) => {
  try {
    const {
      sellerInventory,
      type,
      startDate,
      endDate,
      discountPercentage,
    } = req.body;

    const product =
      await SellerInventory.findById(
        sellerInventory
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (
      product.seller.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Unauthorized to add deal",
      });
    }

    const deal = await Deal.create({
      sellerInventory,
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
        path: "sellerInventory",
        select:
          "name media brand price discountPrice category",
        populate: {
          path: "category",
          select: "name",
        },
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
        path: "sellerInventory",
        select:
          "name media brand price discountPrice category",
        populate: {
          path: "category",
          select: "name",
        },
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

/* =========================================
   UPDATE DEAL
========================================= */
exports.updateDeal = async (
  req,
  res
) => {
  try {
    const deal =
      await Deal.findById(
        req.params.id
      ).populate(
        "sellerInventory"
      );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (
      deal.sellerInventory.seller.toString() !==
      req.user._id.toString()
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
        "sellerInventory"
      );

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    if (
      deal.sellerInventory.seller.toString() !==
      req.user._id.toString()
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
      message: error.message,
    });
  }
};

/* =========================================
   TOP DEAL OF THE DAY
========================================= */
exports.getTopDeal = async (
  req,
  res
) => {
  try {
    const deal =
      await Deal.findOne({
        type: "topDeal",
        isActive: true,
      })
        .populate({
          path: "sellerInventory",
          select:
            "name media brand price discountPrice category",
          populate: {
            path: "category",
            select: "name",
          },
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
          path: "sellerInventory",
          select:
            "name media brand price discountPrice category",
          populate: {
            path: "category",
            select: "name",
          },
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