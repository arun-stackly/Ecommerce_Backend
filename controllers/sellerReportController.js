const UserOrder = require("../models/UserOrder");
const mongoose = require("mongoose");

const { getS3SignedUrl } = require("../utils/s3Helper");

/* =========================================================
   GET SELLER SALES REPORT
   GET /api/seller/reports/sales

   Query params:
   ?type=today
   ?type=week
   ?type=month

   ?payment=COD
   ?payment=prepaid

   ?status=completed
   ?status=ordered
   ?status=shipped
   ?status=cancelled
   ?status=exchange
   ?status=return
========================================================= */

exports.salesReport = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const { type, payment, status } = req.query;

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    /* =====================================================
       BASE MATCH
    ===================================================== */

    const match = {
      "items.sellerId": sellerObjectId,
    };

    /* =====================================================
       DATE FILTER
    ===================================================== */

    let startDate;
    const now = new Date();

    // TODAY
    if (type === "today") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      match.createdAt = {
        $gte: startDate,
      };
    }

    // LAST 7 DAYS
    else if (type === "week") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);

      match.createdAt = {
        $gte: startDate,
      };
    }

    // CURRENT MONTH
    else if (type === "month") {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

      match.createdAt = {
        $gte: startDate,
      };
    }

    /* =====================================================
       STATUS FILTER
    ===================================================== */

    if (status === "completed") {
      match.orderStatus = "delivered";
    } else if (status) {
      match.orderStatus = status;
    }

    /* =====================================================
       PAYMENT FILTER
    ===================================================== */

    if (payment === "COD") {
      match.paymentMode = "COD";
    } else if (payment === "prepaid") {
      match.paymentMode = {
        $ne: "COD",
      };
    }

    /* =====================================================
       SUMMARY
    ===================================================== */

    const summaryAgg = await UserOrder.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: null,

          totalOrders: {
            $sum: 1,
          },

          pendingOrders: {
            $sum: {
              $cond: [
                {
                  $eq: ["$orderStatus", "ordered"],
                },
                1,
                0,
              ],
            },
          },

          cancelledOrders: {
            $sum: {
              $cond: [
                {
                  $eq: ["$orderStatus", "cancelled"],
                },
                1,
                0,
              ],
            },
          },

          completedOrders: {
            $sum: {
              $cond: [
                {
                  $eq: ["$orderStatus", "delivered"],
                },
                1,
                0,
              ],
            },
          },

          codCount: {
            $sum: {
              $cond: [
                {
                  $eq: ["$paymentMode", "COD"],
                },
                1,
                0,
              ],
            },
          },

          prepaidCount: {
            $sum: {
              $cond: [
                {
                  $ne: ["$paymentMode", "COD"],
                },
                1,
                0,
              ],
            },
          },

          earnings: {
            $sum: {
              $cond: [
                {
                  $eq: ["$orderStatus", "delivered"],
                },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
    ]);

    /* =====================================================
       ORDERS
    ===================================================== */

    const orders = await UserOrder.find(match)
      .select(
        "orderId customerName paymentMode orderStatus totalAmount createdAt items"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    /* =====================================================
       S3 SIGNED IMAGE URL
    ===================================================== */

    const ordersWithImages = await Promise.all(
      orders.map(async (order) => {
        order.items = await Promise.all(
          order.items.map(async (item) => {
            if (item.image) {
              try {
                item.image = await getS3SignedUrl(item.image);
              } catch (error) {
                console.error(
                  "S3 image URL generation failed:",
                  error.message
                );

                item.image = null;
              }
            }

            return item;
          })
        );

        return order;
      })
    );

    /* =====================================================
       MONTHLY SALES GRAPH
    ===================================================== */

    const monthlyGraph = await UserOrder.aggregate([
      {
        $match: {
          "items.sellerId": sellerObjectId,
          orderStatus: "delivered",
        },
      },

      {
        $group: {
          _id: {
            $month: "$createdAt",
          },

          totalSales: {
            $sum: "$totalAmount",
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    /* =====================================================
       RESPONSE
    ===================================================== */

    res.status(200).json({
      success: true,

      summary:
        summaryAgg[0] || {
          totalOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
          completedOrders: 0,
          codCount: 0,
          prepaidCount: 0,
          earnings: 0,
        },

      orders: ordersWithImages,

      graph: monthlyGraph,
    });
  } catch (error) {
    console.error("Sales Report Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch sales report",
      error: error.message,
    });
  }
};