const Order = require("../models/Order");
const mongoose = require("mongoose");

/*
  GET /api/seller/reports/sales
  ?type=today | week | month
  ?payment=COD | prepaid
  ?status=pending | cancelled | completed
*/
exports.salesReport = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { type, payment, status } = req.query;

    const match = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
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
    if (status) {
      match.status = status;
    }

    /* ================= PAYMENT FILTER ================= */
    if (payment === "COD") {
      match.paymentMode = "COD";
    }

    if (payment === "prepaid") {
      match.paymentMode = { $ne: "COD" };
    }

    /* ================= SUMMARY ================= */
    const summaryAgg = await Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },

          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },

          codCount: {
            $sum: { $cond: [{ $eq: ["$paymentMode", "COD"] }, 1, 0] },
          },
          prepaidCount: {
            $sum: { $cond: [{ $ne: ["$paymentMode", "COD"] }, 1, 0] },
          },

          earnings: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$totalAmount", 0],
            },
          },
        },
      },
    ]);

    /* ================= ORDER LIST ================= */
    const orders = await Order.find(match)
      .select(
        "orderId customerName paymentMode status totalAmount createdAt inventorySnapshot",
      )
      .sort({ createdAt: -1 });

    /* ================= MONTHLY BAR GRAPH ================= */
    const monthlyGraph = await Order.aggregate([
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(sellerId),
          status: "completed",
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
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
    res.status(500).json({ message: "Server error" });
  }
};
