const UserOrder = require("../models/UserOrder");
const mongoose = require("mongoose");
 
/*
  GET /api/seller/reports/sales
  ?type=today | week | month
  ?payment=COD | prepaid
  ?status=ordered | shipped | completed | cancelled
*/
exports.salesReport = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { type, payment, status } = req.query;
 
    const match = {
      "items.sellerId": new mongoose.Types.ObjectId(sellerId),
    };
 
    /* ================= DATE FILTER ================= */
    let startDate;
    const now = new Date();
 
    if (type === "today") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    }
 
    if (type === "week") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    }
 
    if (type === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
 
    if (startDate) {
      match.createdAt = { $gte: startDate };
    }
 
    /* ================= STATUS FILTER ================= */
    if (status === "completed") {
      match.orderStatus = "delivered";
    } else if (status) {
      match.orderStatus = status;
    }
 
    /* ================= PAYMENT FILTER ================= */
    if (payment === "COD") {
      match.paymentMode = "COD";
    }
 
    if (payment === "prepaid") {
      match.paymentMode = { $ne: "COD" };
    }
 
    /* ================= SUMMARY ================= */
    const summaryAgg = await UserOrder.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
 
          totalOrders: { $sum: 1 },
 
          pendingOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "ordered"] }, 1, 0],
            },
          },
 
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "cancelled"] }, 1, 0],
            },
          },
 
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ["$orderStatus", "delivered"] }, 1, 0],
            },
          },
 
          codCount: {
            $sum: {
              $cond: [{ $eq: ["$paymentMode", "COD"] }, 1, 0],
            },
          },
 
          prepaidCount: {
            $sum: {
              $cond: [{ $ne: ["$paymentMode", "COD"] }, 1, 0],
            },
          },
 
          earnings: {
            $sum: {
              $cond: [
                { $eq: ["$orderStatus", "delivered"] },
                "$totalAmount",
                0,
              ],
            },
          },
        },
      },
    ]);
 
    /* ================= ORDER LIST ================= */
    const orders = await UserOrder.find(match)
      .select(
        "orderId customerName paymentMode orderStatus totalAmount createdAt items",
      )
      .sort({ createdAt: -1 });
 
    /* ================= MONTHLY BAR GRAPH ================= */
    const monthlyGraph = await UserOrder.aggregate([
      {
        $match: {
          "items.sellerId": new mongoose.Types.ObjectId(sellerId),
          orderStatus: "delivered",
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
 
    res.json({
      success: true,
      summary: summaryAgg[0] || {
        totalOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        completedOrders: 0,
        codCount: 0,
        prepaidCount: 0,
        earnings: 0,
      },
      orders,
      graph: monthlyGraph,
    });
  } catch (error) {
    console.error("Sales Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
 
 