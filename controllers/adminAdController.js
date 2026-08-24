const Ad = require("../models/Ad");

/* =====================================================
   GET ADVERTISEMENT STATS

   GET /api/admin/ads/stats
===================================================== */

exports.getAdStats = async (req, res) => {
  try {
    const [
      pendingApproval,
      approved,
      rejected,
      budgetResult,
    ] = await Promise.all([
      Ad.countDocuments({
        status: "pending",
      }),

      Ad.countDocuments({
        status: "approved",
      }),

      Ad.countDocuments({
        status: "rejected",
      }),

      Ad.aggregate([
        {
          $match: {
            status: {
              $in: [
                "pending",
                "approved",
                "rejected",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalBudget: {
              $sum: "$requestedBudget",
            },
          },
        },
      ]),
    ]);

    const requestedBudget =
      budgetResult[0]?.totalBudget || 0;

    return res.status(200).json({
      success: true,

      data: {
        pendingApproval,
        approved,
        rejected,
        requestedBudget,
      },
    });
  } catch (error) {
    console.error(
      "Get Advertisement Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch advertisement statistics",
      error: error.message,
    });
  }
};


/* =====================================================
   GET ALL ADVERTISEMENT REQUESTS

   GET /api/admin/ads

   Query:

   ?page=1
   ?limit=10

   ?status=pending
   ?status=approved
   ?status=rejected
   ?status=all

   ?search=iPhone
===================================================== */

exports.getAdminAds = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      status = "all",
      search = "",
    } = req.query;

    page = Math.max(
      Number(page) || 1,
      1
    );

    limit = Math.min(
      Math.max(
        Number(limit) || 10,
        1
      ),
      100
    );

    const skip =
      (page - 1) * limit;

    const filter = {};

    /* =========================================
       STATUS FILTER
    ========================================= */

    if (
      ["pending", "approved", "rejected"].includes(
        status
      )
    ) {
      filter.status = status;
    }

    /* =========================================
       SEARCH

       Search:
       - seller name
       - product name
       - description
    ========================================= */

    if (search.trim()) {
      const searchRegex = {
        $regex: search.trim(),
        $options: "i",
      };

      const matchingSellers =
        await require("../models/User").find({
          $or: [
            {
              name: searchRegex,
            },
            {
              firstName: searchRegex,
            },
            {
              lastName: searchRegex,
            },
            {
              email: searchRegex,
            },
          ],
        }).select("_id");

      const sellerIds =
        matchingSellers.map(
          (seller) => seller._id
        );

      const matchingProducts =
        await require("../models/SellerInventory")
          .find({
            name: searchRegex,
          })
          .select("_id");

      const productIds =
        matchingProducts.map(
          (product) => product._id
        );

      filter.$or = [
        {
          seller: {
            $in: sellerIds,
          },
        },
        {
          product: {
            $in: productIds,
          },
        },
        {
          description: searchRegex,
        },
      ];
    }

    /* =========================================
       GET ADS
    ========================================= */

    const [
      ads,
      totalAds,
    ] = await Promise.all([
      Ad.find(filter)
        .populate({
          path: "seller",
          select:
            "name firstName lastName email",
        })
        .populate({
          path: "product",
          select:
            "name price media",
        })
        .populate({
          path: "category",
          select: "name",
        })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Ad.countDocuments(filter),
    ]);

    /* =========================================
       FORMAT RESPONSE
    ========================================= */

    const formattedAds = ads.map(
      (ad) => ({
        _id: ad._id,

        seller: {
          _id: ad.seller?._id,
          name:
            ad.seller?.name ||
            `${ad.seller?.firstName || ""} ${
              ad.seller?.lastName || ""
            }`.trim(),
          email:
            ad.seller?.email || "",
        },

        product: {
          _id: ad.product?._id,
          name:
            ad.product?.name || "",
          image:
            ad.mediaUrl ||
            ad.product?.media?.find(
              (m) => m.type === "image"
            )?.url ||
            "",
        },

        category:
          ad.category?.name || "",

        adType:
          ad.adType,

        description:
          ad.description || "",

        requestedBudget:
          ad.requestedBudget || 0,

        status:
          ad.status,

        requestedAt:
          ad.requestedAt ||
          ad.createdAt,

        approvedAt:
          ad.approvedAt,

        rejectedAt:
          ad.rejectedAt,

        rejectionReason:
          ad.rejectionReason || "",

        isActive:
          ad.isActive,

        createdAt:
          ad.createdAt,

        updatedAt:
          ad.updatedAt,
      })
    );

    const totalPages =
      Math.ceil(totalAds / limit);

    return res.status(200).json({
      success: true,

      count: formattedAds.length,

      data: formattedAds,

      pagination: {
        page,
        limit,
        totalAds,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get Admin Ads Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch advertisements",
      error: error.message,
    });
  }
};


/* =====================================================
   GET SINGLE ADVERTISEMENT

   GET /api/admin/ads/:id
===================================================== */

exports.getAdminAdById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id)
      .populate({
        path: "seller",
        select:
          "name firstName lastName email phone",
      })
      .populate({
        path: "product",
        select:
          "name price media",
      })
      .populate({
        path: "category",
        select: "name",
      })
      .populate({
        path: "subcategory",
        select: "name",
      })
      .populate({
        path: "subSubcategory",
        select: "name",
      })
      .populate({
        path: "productType",
        select: "name",
      });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: ad,
    });
  } catch (error) {
    console.error(
      "Get Admin Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch advertisement",
      error: error.message,
    });
  }
};


/* =====================================================
   APPROVE ADVERTISEMENT

   PATCH /api/admin/ads/:id/approve
===================================================== */

exports.approveAd = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    if (ad.status === "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Advertisement is already approved",
      });
    }

    ad.status = "approved";

    ad.approvedAt = new Date();

    ad.rejectedAt = null;

    ad.rejectionReason = "";

    ad.isActive = true;

    await ad.save();

    return res.status(200).json({
      success: true,
      message:
        "Advertisement approved successfully",
      data: ad,
    });
  } catch (error) {
    console.error(
      "Approve Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve advertisement",
      error: error.message,
    });
  }
};


/* =====================================================
   REJECT ADVERTISEMENT

   PATCH /api/admin/ads/:id/reject
===================================================== */

exports.rejectAd = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      rejectionReason = "",
    } = req.body;

    const ad = await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    if (ad.status === "rejected") {
      return res.status(400).json({
        success: false,
        message:
          "Advertisement is already rejected",
      });
    }

    ad.status = "rejected";

    ad.rejectedAt = new Date();

    ad.approvedAt = null;

    ad.rejectionReason =
      rejectionReason;

    ad.isActive = false;

    await ad.save();

    return res.status(200).json({
      success: true,
      message:
        "Advertisement rejected successfully",
      data: ad,
    });
  } catch (error) {
    console.error(
      "Reject Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to reject advertisement",
      error: error.message,
    });
  }
};
