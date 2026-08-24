const Coupon = require("../models/couponModel");

/* =========================================================
   ADMIN COUPON STATS
   GET /api/admin/coupons/stats
========================================================= */

exports.getCouponStats = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      redemptionsResult,
    ] = await Promise.all([
      Coupon.countDocuments(),

      Coupon.countDocuments({
        isActive: true,
        $or: [
          { expiryDate: { $exists: false } },
          { expiryDate: null },
          { expiryDate: { $gte: now } },
        ],
      }),

      Coupon.countDocuments({
        expiryDate: {
          $lt: now,
        },
      }),

      Coupon.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$usedCount",
            },
          },
        },
      ]),
    ]);

    const redemptions =
      redemptionsResult[0]?.total || 0;

    // Your current Coupon schema has no startDate,
    // so scheduled coupons cannot be calculated.
    const scheduledCoupons = 0;

    return res.status(200).json({
      success: true,

      data: {
        totalCoupons,
        activeCoupons,
        scheduledCoupons,
        expiredCoupons,
        redemptions,
      },
    });
  } catch (error) {
    console.error(
      "Admin Coupon Stats Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon statistics",
      error: error.message,
    });
  }
};


/* =========================================================
   ADMIN GET ALL COUPONS
   GET /api/admin/coupons

   Query:
   ?page=1
   ?limit=10
   ?search=WELCOME
   ?status=active
========================================================= */

exports.getAdminCoupons = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
    } = req.query;

    page = Math.max(Number(page) || 1, 1);

    limit = Math.min(
      Math.max(Number(limit) || 10, 1),
      100
    );

    const skip = (page - 1) * limit;

    const filter = {};

    /* ---------------- SEARCH ---------------- */

    if (search.trim()) {
      filter.code = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    /* ---------------- STATUS ---------------- */

    const now = new Date();

    if (status === "active") {
      filter.isActive = true;

      filter.$or = [
        {
          expiryDate: {
            $exists: false,
          },
        },
        {
          expiryDate: null,
        },
        {
          expiryDate: {
            $gte: now,
          },
        },
      ];
    }

    if (status === "expired") {
      filter.expiryDate = {
        $lt: now,
      };
    }

    if (status === "inactive") {
      filter.isActive = false;
    }

    /*
      Your current schema does not contain
      startDate, therefore scheduled is not
      possible yet.
    */

    /* ---------------- QUERY ---------------- */

    const [
      coupons,
      totalCoupons,
    ] = await Promise.all([
      Coupon.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Coupon.countDocuments(filter),
    ]);

    /* ---------------- FORMAT ---------------- */

    const formattedCoupons = coupons.map(
      (coupon) => {
        let couponStatus = "active";

        if (!coupon.isActive) {
          couponStatus = "inactive";
        } else if (
          coupon.expiryDate &&
          new Date(coupon.expiryDate) < now
        ) {
          couponStatus = "expired";
        }

        return {
          _id: coupon._id,

          code: coupon.code,

          description:
            coupon.description || "",

          type: coupon.type,

          discount: coupon.discount,

          minOrderValue:
            coupon.minOrderValue || 0,

          maxDiscount:
            coupon.maxDiscount || null,

          usage: {
            used: coupon.usedCount || 0,
            limit: coupon.usageLimit,
          },

          expiryDate:
            coupon.expiryDate || null,

          status: couponStatus,

          isActive: coupon.isActive,

          createdAt:
            coupon.createdAt,

          updatedAt:
            coupon.updatedAt,
        };
      }
    );

    const totalPages = Math.ceil(
      totalCoupons / limit
    );

    return res.status(200).json({
      success: true,

      data: formattedCoupons,

      pagination: {
        page,
        limit,
        totalCoupons,
        totalPages,

        hasNextPage:
          page < totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Admin Get Coupons Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};
