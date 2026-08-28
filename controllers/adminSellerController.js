const asyncHandler = require("express-async-handler");

const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const SellerInventory = require("../models/SellerInventory");
const UserOrder = require("../models/UserOrder");

/* =====================================================
   GET SELLER MANAGEMENT
===================================================== */

const getSellerManagement = asyncHandler(async (req, res) => {

  /* ===================================================
     1. GET ALL SELLERS

     IMPORTANT:
     This is the MAIN source.

     Every seller comes from User.
  =================================================== */

  const sellers = await User.find({
    role: "seller",
  })
    .select(
      "-password -resetOTP -resetOTPExpiry"
    )
    .sort({
      createdAt: -1,
    })
    .lean();

  /* ===================================================
     SELLER IDS
  =================================================== */

  const sellerIds = sellers.map(
    (seller) => seller._id
  );

  /* ===================================================
     2. GET PROFILES

     Profile is OPTIONAL.
     It must NOT remove a seller.
  =================================================== */

  const profiles =
    await SellerProfile.find({
      user: {
        $in: sellerIds,
      },
    }).lean();

  const profileMap = new Map();

  profiles.forEach((profile) => {

    if (!profile.user) {
      return;
    }

    profileMap.set(
      profile.user.toString(),
      profile
    );
  });

  /* ===================================================
     3. GET PRODUCT STATISTICS

     This is OPTIONAL.

     If seller has no products:
       productCount = 0
       ratings = 0
  =================================================== */

  const productStats =
    await SellerInventory.aggregate([
      {
        $match: {
          seller: {
            $in: sellerIds,
          },

          isActive: {
            $ne: false,
          },
        },
      },

      {
        $unwind: {
          path: "$reviews",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $group: {
          _id: "$seller",

          products: {
            $addToSet: "$_id",
          },

          totalRating: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    "$reviews.rating",
                    null,
                  ],
                },

                {
                  $ifNull: [
                    "$reviews.rating",
                    0,
                  ],
                },

                0,
              ],
            },
          },

          totalRatings: {
            $sum: {
              $cond: [
                {
                  $ne: [
                    "$reviews.rating",
                    null,
                  ],
                },

                1,

                0,
              ],
            },
          },
        },
      },

      {
        $project: {
          _id: 1,

          productCount: {
            $size: "$products",
          },

          ratings: {
            $cond: [
              {
                $gt: [
                  "$totalRatings",
                  0,
                ],
              },

              {
                $round: [
                  {
                    $divide: [
                      "$totalRating",
                      "$totalRatings",
                    ],
                  },

                  1,
                ],
              },

              0,
            ],
          },
        },
      },
    ]);

  const productStatsMap =
    new Map();

  productStats.forEach((item) => {

    productStatsMap.set(
      item._id.toString(),
      {
        productCount:
          item.productCount || 0,

        ratings:
          item.ratings || 0,
      }
    );
  });

  /* ===================================================
     4. GET REVENUE

     OPTIONAL.

     If seller has no orders:
       revenue = 0
  =================================================== */

  const revenueStats =
    await UserOrder.aggregate([
      {
        $unwind: "$items",
      },

      {
        $match: {
          "items.sellerId": {
            $in: sellerIds,
          },

          "items.itemStatus": {
            $nin: [
              "cancelled",
              "return",
            ],
          },
        },
      },

      {
        $group: {
          _id: "$items.sellerId",

          revenue: {
            $sum: {
              $ifNull: [
                "$items.itemTotal",
                0,
              ],
            },
          },
        },
      },
    ]);

  const revenueMap =
    new Map();

  revenueStats.forEach((item) => {

    revenueMap.set(
      item._id.toString(),
      Number(
        item.revenue || 0
      )
    );
  });

  /* ===================================================
     5. BUILD RESPONSE

     IMPORTANT:

     We loop through USERS.

     Therefore EVERY seller is returned.
  =================================================== */

  const sellerDetails =
    sellers.map((seller) => {

      const sellerId =
        seller._id.toString();

      /* -----------------------------------------------
         Profile

         May not exist.
      ------------------------------------------------ */

      const profile =
        profileMap.get(
          sellerId
        );

      /* -----------------------------------------------
         Product statistics

         May not exist.
      ------------------------------------------------ */

      const stats =
        productStatsMap.get(
          sellerId
        ) || {
          productCount: 0,
          ratings: 0,
        };

      /* -----------------------------------------------
         Revenue

         May not exist.
      ------------------------------------------------ */

      const revenue =
        revenueMap.get(
          sellerId
        ) || 0;

      /* -----------------------------------------------
         RETURN SELLER
      ------------------------------------------------ */

      return {

        /* User */

        _id:
          seller._id,

        name:
          `${seller.firstName || ""} ${
            seller.lastName || ""
          }`.trim(),

        email:
          seller.email || "",

        /* Seller Profile */

        phone:
          profile?.phone || "",

        location:
          profile?.address || "",

        profileImage:
          profile?.profileImage ||
          null,

        /* Product */

        productCount:
          stats.productCount,

        /* Revenue */

        revenue:
          Number(revenue),

        /* Rating */

        ratings:
          Number(
            stats.ratings || 0
          ),

        /* Status */

        status:
          seller.sellerApprovalStatus ||
          "pending",

        verified:
          seller.isVerified ||
          false,

        /* Date */

        joinedDate:
          seller.createdAt,
      };
    });

  /* ===================================================
     6. SUMMARY
  =================================================== */

  const totalSellers =
    sellerDetails.length;

  const approvedSellers =
    sellerDetails.filter(
      (seller) =>
        seller.status ===
        "approved"
    ).length;

  const pendingSellers =
    sellerDetails.filter(
      (seller) =>
        seller.status ===
        "pending"
    ).length;

  const rejectedSellers =
    sellerDetails.filter(
      (seller) =>
        seller.status ===
        "rejected"
    ).length;

  const sellerRevenue =
    sellerDetails.reduce(
      (total, seller) =>
        total +
        Number(
          seller.revenue || 0
        ),
      0
    );

  /* ===================================================
     7. RESPONSE
  =================================================== */

  res.status(200).json({

    success: true,

    summary: {

      totalSellers,

      approvedSellers,

      pendingApproval:
        pendingSellers,

      rejectedSellers,

      sellerRevenue,
    },

    sellers:
      sellerDetails,
  });
});


/* =====================================================
   APPROVE SELLER
===================================================== */

const approveSeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  const seller = await User.findOne({
    _id: sellerId,
    role: "seller",
  });

  if (!seller) {
    res.status(404);
    throw new Error("Seller not found");
  }

  // Admin approval
  seller.sellerApprovalStatus = "approved";

  // Mark seller as verified
  seller.isVerified = true;

  await seller.save();

  res.status(200).json({
    success: true,

    message: "Seller approved successfully",

    seller: {
      _id: seller._id,
      sellerApprovalStatus: seller.sellerApprovalStatus,
      isVerified: seller.isVerified,
    },
  });
});
/* =====================================================
   REJECT SELLER
===================================================== */

const rejectSeller =
  asyncHandler(
    async (req, res) => {

      const { sellerId } =
        req.params;

      const seller =
        await User.findOne({
          _id: sellerId,
          role: "seller",
        });

      if (!seller) {

        res.status(404);

        throw new Error(
          "Seller not found"
        );
      }

      seller.sellerApprovalStatus =
        "rejected";

      await seller.save();

      res.status(200).json({

        success: true,

        message:
          "Seller rejected successfully",

        seller: {

          _id:
            seller._id,

          sellerApprovalStatus:
            seller.sellerApprovalStatus,
        },
      });
    }
  );

const getSellerById = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  // 1. Get seller
  const seller = await User.findOne({
    _id: sellerId,
    role: "seller",
  })
    .select("-password -resetOTP -resetOTPExpiry")
    .lean();

  if (!seller) {
    res.status(404);
    throw new Error("Seller not found");
  }

  // 2. Get seller profile
  const profile = await SellerProfile.findOne({
    user: seller._id,
  }).lean();

  // 3. Get seller products
  const products = await SellerInventory.find({
    seller: seller._id,
  }).lean();

  // 4. Get seller orders
  const orders = await UserOrder.find({
    "items.sellerId": seller._id,
  }).lean();

  // 5. Response
  res.status(200).json({
    success: true,

    seller: {
      _id: seller._id,

      name: `${seller.firstName || ""} ${
        seller.lastName || ""
      }`.trim(),

      email: seller.email || "",

      phone: profile?.phone || "",

      location: profile?.address || "",

      profileImage:
        profile?.profileImage || null,

      status:
        seller.sellerApprovalStatus || "pending",

      verified:
        seller.isVerified || false,

      joinedDate: seller.createdAt,

      products,

      orders,

      productCount: products.length,

      orderCount: orders.length,
    },
  });
});
/* =====================================================
   EXPORT
===================================================== */

module.exports = {
  getSellerManagement,
  approveSeller,
  rejectSeller,
 getSellerById,
};