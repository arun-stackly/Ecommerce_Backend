const Coupon = require("../models/couponModel");

/* =========================================================
   HELPER
   GET COUPON STATUS

   Possible values:
   - active
   - scheduled
   - expired
   - inactive
========================================================= */

const getCouponStatus = (
  coupon,
  now = new Date()
) => {
  // Manually disabled
  if (!coupon.isActive) {
    return "inactive";
  }

  // Expired
  if (
    coupon.expiryDate &&
    new Date(coupon.expiryDate) < now
  ) {
    return "expired";
  }

  // Scheduled
  if (
    coupon.startDate &&
    new Date(coupon.startDate) > now
  ) {
    return "scheduled";
  }

  // Currently active
  return "active";
};


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
      scheduledCoupons,
      expiredCoupons,
      redemptionsResult,
    ] = await Promise.all([
      /* ---------------------------------
         TOTAL
      --------------------------------- */

      Coupon.countDocuments(),

      /* ---------------------------------
         ACTIVE

         isActive = true
         startDate <= now
         expiryDate >= now OR no expiry
      --------------------------------- */

      Coupon.countDocuments({
        isActive: true,

        $and: [
          {
            $or: [
              {
                startDate: {
                  $exists: false,
                },
              },
              {
                startDate: null,
              },
              {
                startDate: {
                  $lte: now,
                },
              },
            ],
          },

          {
            $or: [
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
            ],
          },
        ],
      }),

      /* ---------------------------------
         SCHEDULED
      --------------------------------- */

      Coupon.countDocuments({
        isActive: true,

        startDate: {
          $gt: now,
        },
      }),

      /* ---------------------------------
         EXPIRED
      --------------------------------- */

      Coupon.countDocuments({
        expiryDate: {
          $lt: now,
        },
      }),

      /* ---------------------------------
         TOTAL REDEMPTIONS
      --------------------------------- */

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
      message:
        "Failed to fetch coupon statistics",
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
   ?status=all

   status:
   - all
   - active
   - scheduled
   - expired
   - inactive
========================================================= */

exports.getAdminCoupons = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status = "all",
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

    const now = new Date();

    const filter = {};

    /* =====================================================
       SEARCH
    ===================================================== */

    if (
      typeof search === "string" &&
      search.trim()
    ) {
      filter.code = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    /* =====================================================
       STATUS FILTER
    ===================================================== */

    // -----------------------------------------------
    // ACTIVE
    // -----------------------------------------------

    if (status === "active") {
      filter.isActive = true;

      filter.$and = [
        {
          $or: [
            {
              startDate: {
                $exists: false,
              },
            },
            {
              startDate: null,
            },
            {
              startDate: {
                $lte: now,
              },
            },
          ],
        },

        {
          $or: [
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
          ],
        },
      ];
    }

    // -----------------------------------------------
    // SCHEDULED
    // -----------------------------------------------

    if (status === "scheduled") {
      filter.isActive = true;

      filter.startDate = {
        $gt: now,
      };
    }

    // -----------------------------------------------
    // EXPIRED
    // -----------------------------------------------

    if (status === "expired") {
      filter.expiryDate = {
        $lt: now,
      };
    }

    // -----------------------------------------------
    // INACTIVE
    // -----------------------------------------------

    if (status === "inactive") {
      filter.isActive = false;
    }

    /* =====================================================
       DATABASE QUERY
    ===================================================== */

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

    /* =====================================================
       FORMAT RESPONSE
    ===================================================== */

    const formattedCoupons =
      coupons.map((coupon) => {
        const couponStatus =
          getCouponStatus(
            coupon,
            now
          );

        return {
          _id: coupon._id,

          code: coupon.code,

          description:
            coupon.description || "",

          type: coupon.type,

          discount:
            coupon.discount,

          minOrderValue:
            coupon.minOrderValue || 0,

          maxDiscount:
            coupon.maxDiscount ?? null,

          usage: {
            used:
              coupon.usedCount || 0,

            limit:
              coupon.usageLimit ?? null,
          },

          startDate:
            coupon.startDate || null,

          expiryDate:
            coupon.expiryDate || null,

          status:
            couponStatus,

          isActive:
            coupon.isActive,

          createdAt:
            coupon.createdAt,

          updatedAt:
            coupon.updatedAt,
        };
      });

    /* =====================================================
       PAGINATION
    ===================================================== */

    const totalPages =
      Math.ceil(
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
      message:
        "Failed to fetch coupons",
      error: error.message,
    });
  }
};


/* =========================================================
   ADMIN ADD COUPON
   POST /api/admin/coupons
========================================================= */

exports.addCoupon = async (req, res) => {
  try {
    const {
      code,
      type,
      discount,
      minOrderValue,
      maxDiscount,
      description,
      startDate,
      expiryDate,
      usageLimit,
    } = req.body;

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      !code ||
      !type ||
      discount === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "code, type, and discount are required",
      });
    }

    /* =====================================================
       NORMALIZE
    ===================================================== */

    const normalizedCode =
      String(code)
        .trim()
        .toUpperCase();

    const normalizedType =
      String(type)
        .trim()
        .toUpperCase();

    /* =====================================================
       TYPE VALIDATION
    ===================================================== */

    if (
      !["FLAT", "PERCENT"].includes(
        normalizedType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "type must be FLAT or PERCENT",
      });
    }

    /* =====================================================
       DISCOUNT VALIDATION
    ===================================================== */

    const discountValue =
      Number(discount);

    if (
      !Number.isFinite(
        discountValue
      ) ||
      discountValue <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount must be greater than 0",
      });
    }

    if (
      normalizedType === "PERCENT" &&
      discountValue > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot be greater than 100",
      });
    }

    /* =====================================================
       CHECK DUPLICATE CODE
    ===================================================== */

    const existing =
      await Coupon.findOne({
        code: normalizedCode,
      });

    if (existing) {
      return res.status(400).json({
        success: false,
        message:
          "Coupon already exists",
      });
    }

    /* =====================================================
       START DATE
    ===================================================== */

    const start =
      startDate
        ? new Date(startDate)
        : new Date();

    if (
      isNaN(start.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid start date",
      });
    }

    /* =====================================================
       EXPIRY DATE
    ===================================================== */

    const expiry =
      expiryDate
        ? new Date(expiryDate)
        : null;

    if (
      expiry &&
      isNaN(expiry.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid expiry date",
      });
    }

    /* =====================================================
       DATE VALIDATION
    ===================================================== */

    if (
      expiry &&
      expiry <= start
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Expiry date must be after start date",
      });
    }

    /* =====================================================
       MIN ORDER
    ===================================================== */

    const minimumOrder =
      Number(minOrderValue) || 0;

    if (
      minimumOrder < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum order value cannot be negative",
      });
    }

    /* =====================================================
       MAX DISCOUNT
    ===================================================== */

    let maximumDiscount = null;

    if (
      maxDiscount !== undefined &&
      maxDiscount !== null &&
      maxDiscount !== ""
    ) {
      maximumDiscount =
        Number(maxDiscount);

      if (
        !Number.isFinite(
          maximumDiscount
        ) ||
        maximumDiscount < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid max discount",
        });
      }
    }

    /* =====================================================
       USAGE LIMIT
    ===================================================== */

    let limit = null;

    if (
      usageLimit !== undefined &&
      usageLimit !== null &&
      usageLimit !== ""
    ) {
      limit =
        Number(usageLimit);

      if (
        !Number.isFinite(limit) ||
        limit < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid usage limit",
        });
      }
    }

    /* =====================================================
       CREATE COUPON
    ===================================================== */

    const coupon =
      await Coupon.create({
        code: normalizedCode,

        type: normalizedType,

        discount: discountValue,

        minOrderValue:
          minimumOrder,

        maxDiscount:
          maximumDiscount,

        description:
          description || "",

        startDate: start,

        expiryDate: expiry,

        usageLimit: limit,

        isActive: true,

        usedCount: 0,
      });

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      success: true,

      message:
        "Coupon created successfully",

      coupon,
    });
  } catch (error) {
    console.error(
      "Admin Add Coupon Error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};


/* =========================================================
   ADMIN UPDATE COUPON
   PUT /api/admin/coupons/:id
========================================================= */

exports.updateCoupon = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    const {
      code,
      type,
      discount,
      minOrderValue,
      maxDiscount,
      description,
      startDate,
      expiryDate,
      usageLimit,
      isActive,
    } = req.body;

    /* =====================================================
       FIND COUPON
    ===================================================== */

    const coupon =
      await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message:
          "Coupon not found",
      });
    }

    /* =====================================================
       CODE
    ===================================================== */

    if (
      code !== undefined
    ) {
      const normalizedCode =
        String(code)
          .trim()
          .toUpperCase();

      if (!normalizedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Coupon code cannot be empty",
        });
      }

      const existingCoupon =
        await Coupon.findOne({
          code: normalizedCode,

          _id: {
            $ne: id,
          },
        });

      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message:
            "Coupon code already exists",
        });
      }

      coupon.code =
        normalizedCode;
    }

    /* =====================================================
       TYPE
    ===================================================== */

    if (
      type !== undefined
    ) {
      const normalizedType =
        String(type)
          .trim()
          .toUpperCase();

      if (
        !["FLAT", "PERCENT"].includes(
          normalizedType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "type must be FLAT or PERCENT",
        });
      }

      coupon.type =
        normalizedType;
    }

    /* =====================================================
       DISCOUNT
    ===================================================== */

    if (
      discount !== undefined
    ) {
      const discountValue =
        Number(discount);

      if (
        !Number.isFinite(
          discountValue
        ) ||
        discountValue <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Discount must be greater than 0",
        });
      }

      coupon.discount =
        discountValue;
    }

    /* =====================================================
       PERCENTAGE VALIDATION
    ===================================================== */

    if (
      coupon.type === "PERCENT" &&
      coupon.discount > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot be greater than 100",
      });
    }

    /* =====================================================
       MIN ORDER VALUE
    ===================================================== */

    if (
      minOrderValue !== undefined
    ) {
      const value =
        Number(minOrderValue);

      if (
        !Number.isFinite(value) ||
        value < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid minimum order value",
        });
      }

      coupon.minOrderValue =
        value;
    }

    /* =====================================================
       MAX DISCOUNT
    ===================================================== */

    if (
      maxDiscount !== undefined
    ) {
      coupon.maxDiscount =
        maxDiscount === null ||
        maxDiscount === ""
          ? null
          : Number(maxDiscount);

      if (
        coupon.maxDiscount !== null &&
        (
          !Number.isFinite(
            coupon.maxDiscount
          ) ||
          coupon.maxDiscount < 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid max discount",
        });
      }
    }

    /* =====================================================
       DESCRIPTION
    ===================================================== */

    if (
      description !== undefined
    ) {
      coupon.description =
        description;
    }

    /* =====================================================
       START DATE
    ===================================================== */

    if (
      startDate !== undefined
    ) {
      if (
        startDate === null ||
        startDate === ""
      ) {
        coupon.startDate =
          new Date();
      } else {
        const start =
          new Date(startDate);

        if (
          isNaN(
            start.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid start date",
          });
        }

        coupon.startDate =
          start;
      }
    }

    /* =====================================================
       EXPIRY DATE
    ===================================================== */

    if (
      expiryDate !== undefined
    ) {
      if (
        expiryDate === null ||
        expiryDate === ""
      ) {
        coupon.expiryDate =
          null;
      } else {
        const expiry =
          new Date(expiryDate);

        if (
          isNaN(
            expiry.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid expiry date",
          });
        }

        coupon.expiryDate =
          expiry;
      }
    }

    /* =====================================================
       DATE RELATIONSHIP
    ===================================================== */

    if (
      coupon.startDate &&
      coupon.expiryDate &&
      coupon.expiryDate <=
        coupon.startDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Expiry date must be after start date",
      });
    }

    /* =====================================================
       USAGE LIMIT
    ===================================================== */

    if (
      usageLimit !== undefined
    ) {
      coupon.usageLimit =
        usageLimit === null ||
        usageLimit === ""
          ? null
          : Number(usageLimit);

      if (
        coupon.usageLimit !== null &&
        (
          !Number.isFinite(
            coupon.usageLimit
          ) ||
          coupon.usageLimit < 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid usage limit",
        });
      }
    }

    /* =====================================================
       CHECK USAGE LIMIT
    ===================================================== */

    if (
      coupon.usageLimit !== null &&
      coupon.usedCount >
        coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Usage limit cannot be less than current usage",
      });
    }

    /* =====================================================
       ACTIVE / INACTIVE
    ===================================================== */

    if (
      isActive !== undefined
    ) {
      coupon.isActive =
        isActive === true ||
        isActive === "true";
    }

    /* =====================================================
       SAVE
    ===================================================== */

    await coupon.save();

    /* =====================================================
       RESPONSE
    ===================================================== */

    const status =
      getCouponStatus(
        coupon,
        new Date()
      );

    return res.status(200).json({
      success: true,

      message:
        "Coupon updated successfully",

      coupon: {
        ...coupon.toObject(),
        status,
      },
    });
  } catch (error) {
    console.error(
      "Admin Update Coupon Error:",
      error
    );

    if (
      error.code === 11000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};


/* =========================================================
   ADMIN DELETE COUPON
   DELETE /api/admin/coupons/:id
========================================================= */

exports.deleteCoupon = async (
  req,
  res
) => {
  try {
    const { id } =
      req.params;

    /* =====================================================
       FIND COUPON
    ===================================================== */

    const coupon =
      await Coupon.findById(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message:
          "Coupon not found",
      });
    }

    /* =====================================================
       DELETE
    ===================================================== */

    await Coupon.deleteOne({
      _id: id,
    });

    return res.status(200).json({
      success: true,

      message:
        "Coupon deleted successfully",

      deletedCoupon: {
        _id: coupon._id,
        code: coupon.code,
      },
    });
  } catch (error) {
    console.error(
      "Admin Delete Coupon Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};
