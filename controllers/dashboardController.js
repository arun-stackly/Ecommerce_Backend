const mongoose = require("mongoose");
const Order = require("../models/Order");
const Refund = require("../models/Refund");

exports.overview = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { filter = "anytime" } = req.query;

    const now = new Date();
    let startDate = null;

    switch (filter) {
      case "quarterly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        break;

      case "halfyearly":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        break;

      case "yearly":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;

      case "anytime":
      default:
        startDate = null;
    }

    // Base filters
    const baseMatch = { sellerId };
    const completedMatch = {
      sellerId,
      status: "completed",
    };

    if (startDate) {
      completedMatch.createdAt = { $gte: startDate };
    }

    // Orders (overall – no filter)
    const totalOrders = await Order.countDocuments({ sellerId });
    const completedOrders = await Order.countDocuments({
      sellerId,
      status: "completed",
    });
    const pendingOrders = await Order.countDocuments({
      sellerId,
      status: "pending",
    });

    // Income (filtered)
    const revenue = await Order.aggregate([
      { $match: completedMatch },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Customers (filtered)
    const customers = await Order.distinct("userId", completedMatch);

    res.json({
      success: true,
      filter,
      totalOrders,
      completedOrders,
      pendingOrders,
      dashboard: {
        customers: {
          total: customers.length,
          growth: 37.8,
        },
        income: {
          total: revenue[0]?.total || 0,
          growth: 37.8,
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

    const now = new Date();
    let startMonth = 0;
    let totalMonths = 12;

    switch (filter) {
      case "quarterly":
        totalMonths = 3;
        break;

      case "halfyearly":
        totalMonths = 6;
        break;

      case "fullyear":
        totalMonths = now.getMonth() + 1; // Jan → current
        break;

      case "anytime":
      default:
        totalMonths = 12;
    }

    startMonth = now.getMonth() - totalMonths + 1;

    const matchStage = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status: "completed",
    };

    const startDate =
      filter === "anytime" ? null : new Date(now.getFullYear(), startMonth, 1);

    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
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

    for (let i = 0; i < totalMonths; i++) {
      const monthIndex = (startMonth + i + 12) % 12;

      const found = salesData.find((s) => s._id === monthIndex + 1);

      data.push({
        month: monthNames[monthIndex],
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
      // Pending refunds
      Refund.countDocuments({ sellerId, status: "pending" }),

      // New refunds (last 7 days)
      Refund.countDocuments({
        sellerId,
        status: "pending",
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),

      // Total refunds
      Refund.countDocuments({ sellerId }),

      // Approved
      Refund.countDocuments({ sellerId, status: "approved" }),

      // Rejected
      Refund.countDocuments({ sellerId, status: "rejected" }),

      // Total refund amount
      Refund.aggregate([
        { $match: { sellerId } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
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
