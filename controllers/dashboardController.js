const mongoose = require("mongoose");
const Order = require("../models/Order");
const Refund = require("../models/Refund");

/* ================= COMMON FILTER CONFIG ================= */

const ALLOWED_FILTERS = ["anytime", "quarterly", "halfyearly", "yearly"];

const getStartDate = (filter) => {
  const now = new Date();

  switch (filter) {
    case "quarterly":
      return new Date(now.getFullYear(), now.getMonth() - 3, 1);

    case "halfyearly":
      return new Date(now.getFullYear(), now.getMonth() - 6, 1);

    case "yearly":
      return new Date(now.getFullYear(), 0, 1);

    case "anytime":
    default:
      return null;
  }
};

const validateFilter = (filter, res) => {
  if (!ALLOWED_FILTERS.includes(filter)) {
    res.status(400).json({
      success: false,
      message: `Invalid filter value. Allowed values: ${ALLOWED_FILTERS.join(
        ", ",
      )}`,
    });
    return false;
  }
  return true;
};

/* ================= DASHBOARD OVERVIEW ================= */

exports.overview = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { filter = "anytime" } = req.query;

    if (!validateFilter(filter, res)) return;

    const startDate = getStartDate(filter);

    const completedMatch = {
      sellerId,
      status: "completed",
    };

    if (startDate) {
      completedMatch.createdAt = { $gte: startDate };
    }

    const [totalOrders, completedOrders, pendingOrders, revenue, customers] =
      await Promise.all([
        Order.countDocuments({ sellerId }),
        Order.countDocuments({ sellerId, status: "completed" }),
        Order.countDocuments({ sellerId, status: "pending" }),

        Order.aggregate([
          { $match: completedMatch },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),

        Order.distinct("userId", completedMatch),
      ]);

    res.json({
      success: true,
      filter,
      totalOrders,
      completedOrders,
      pendingOrders,
      dashboard: {
        customers: {
          total: customers.length,
          growth: 37.8, // placeholder
        },
        income: {
          total: revenue[0]?.total || 0,
          growth: 37.8, // placeholder
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.productViews = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { filter = "anytime" } = req.query;

    const ALLOWED_FILTERS = ["anytime", "quarterly", "halfyearly", "yearly"];
    if (!ALLOWED_FILTERS.includes(filter)) {
      return res.status(400).json({
        success: false,
        message: `Invalid filter value. Allowed values: ${ALLOWED_FILTERS.join(
          ", ",
        )}`,
      });
    }

    const now = new Date();
    let totalMonths = 12;

    if (filter === "quarterly") totalMonths = 3;
    if (filter === "halfyearly") totalMonths = 6;
    if (filter === "yearly") totalMonths = 12;

    const startDate =
      filter === "anytime"
        ? null
        : new Date(now.getFullYear(), now.getMonth() - totalMonths + 1, 1);

    const matchStage = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status: "completed",
    };

    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const data = [];

    for (let i = totalMonths - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

      const month = date.getMonth();
      const year = date.getFullYear();

      const found = salesData.find(
        (s) => s._id.month === month + 1 && s._id.year === year,
      );

      data.push({
        month: monthNames[month],
        lifetimeValue: found ? found.revenue : 0,
        customerCost: found ? Math.round(found.revenue * 0.3) : 0,
      });
    }

    res.json({
      success: true,
      filter,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= REFUND SUMMARY ================= */

exports.refundSummary = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const [
      openRefunds,
      newRefunds,
      totalRefunds,
      approvedRefunds,
      rejectedRefunds,
      totalRefundAmount,
    ] = await Promise.all([
      Refund.countDocuments({ sellerId, status: "pending" }),

      Refund.countDocuments({
        sellerId,
        status: "pending",
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),

      Refund.countDocuments({ sellerId }),

      Refund.countDocuments({ sellerId, status: "approved" }),

      Refund.countDocuments({ sellerId, status: "rejected" }),

      Refund.aggregate([
        { $match: { sellerId } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    res.json({
      success: true,
      openRefunds,
      newRefunds,
      totalRefunds,
      approvedRefunds,
      rejectedRefunds,
      totalRefundAmount: totalRefundAmount[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
