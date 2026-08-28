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
/* ================= ADMIN ADD COUPON ================= */

exports.addCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      discount,
      minOrderValue,
      maxDiscount,
      description,
      expiryDate,
      usageLimit,
    } = req.body;

    if (!code || !type || discount === undefined) {
      return res.status(400).json({
        success: false,
        message: "code, type, and discount are required",
      });
    }

    const normalizedCode = code.trim().toUpperCase();
    const normalizedType = type.trim().toUpperCase();

    if (!["FLAT", "PERCENT"].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: "type must be FLAT or PERCENT",
      });
    }

    if (Number(discount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount must be greater than 0",
      });
    }

    if (
      normalizedType === "PERCENT" &&
      Number(discount) > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be greater than 100",
      });
    }

    const existing = await Coupon.findOne({
      code: normalizedCode,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Coupon already exists",
      });
    }

    const coupon = await Coupon.create({
      code: normalizedCode,
      type: normalizedType,
      discount: Number(discount),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount:
        maxDiscount === undefined ||
        maxDiscount === null ||
        maxDiscount === ""
          ? null
          : Number(maxDiscount),
      description: description || "",
      expiryDate:
        expiryDate === undefined ||
        expiryDate === null ||
        expiryDate === ""
          ? null
          : new Date(expiryDate),
      usageLimit:
        usageLimit === undefined ||
        usageLimit === null ||
        usageLimit === ""
          ? null
          : Number(usageLimit),
      isActive: true,
      usedCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("Admin Add Coupon Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ================= ADMIN UPDATE COUPON ================= */

exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      code,
      type,
      discount,
      minOrderValue,
      maxDiscount,
      description,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    /* ---------- CODE ---------- */

    if (code !== undefined) {
      const normalizedCode = code.trim().toUpperCase();

      const existingCoupon = await Coupon.findOne({
        code: normalizedCode,
        _id: { $ne: id },
      });

      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists",
        });
      }

      coupon.code = normalizedCode;
    }

    /* ---------- TYPE ---------- */

    if (type !== undefined) {
      const normalizedType = type.trim().toUpperCase();

      if (!["FLAT", "PERCENT"].includes(normalizedType)) {
        return res.status(400).json({
          success: false,
          message: "type must be FLAT or PERCENT",
        });
      }

      coupon.type = normalizedType;
    }

    /* ---------- DISCOUNT ---------- */

    if (discount !== undefined) {
      const discountValue = Number(discount);

      if (discountValue <= 0) {
        return res.status(400).json({
          success: false,
          message: "Discount must be greater than 0",
        });
      }

      coupon.discount = discountValue;
    }

    if (
      coupon.type === "PERCENT" &&
      coupon.discount > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot be greater than 100",
      });
    }

    /* ---------- OTHER FIELDS ---------- */

    if (minOrderValue !== undefined) {
      coupon.minOrderValue = Number(minOrderValue) || 0;
    }

    if (maxDiscount !== undefined) {
      coupon.maxDiscount =
        maxDiscount === null || maxDiscount === ""
          ? null
          : Number(maxDiscount);
    }

    if (description !== undefined) {
      coupon.description = description;
    }

    if (expiryDate !== undefined) {
      coupon.expiryDate =
        expiryDate === null || expiryDate === ""
          ? null
          : new Date(expiryDate);
    }

    if (usageLimit !== undefined) {
      coupon.usageLimit =
        usageLimit === null || usageLimit === ""
          ? null
          : Number(usageLimit);
    }

    if (isActive !== undefined) {
      coupon.isActive = Boolean(isActive);
    }

    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("Admin Update Coupon Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ================= ADMIN DELETE COUPON ================= */

exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    await Coupon.deleteOne({
      _id: id,
    });

    // Verify deletion
    const deletedCoupon = await Coupon.findById(id);

    if (deletedCoupon) {
      return res.status(500).json({
        success: false,
        message: "Coupon could not be deleted",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
      deletedCoupon: {
        _id: coupon._id,
        code: coupon.code,
      },
    });

  } catch (error) {
    console.error("Admin Delete Coupon Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};