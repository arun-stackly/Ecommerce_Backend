const mongoose = require("mongoose");
const Order = require("../models/Order");
const Refund = require("../models/Refund");

exports.overview = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const totalOrders = await Order.countDocuments({ sellerId });

    const completedOrders = await Order.countDocuments({
      sellerId,
      status: "completed",
    });

    const pendingOrders = await Order.countDocuments({
      sellerId,
      status: "pending",
    });

    const revenue = await Order.aggregate([
      {
        $match: {
          sellerId,
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const customers = await Order.distinct("userId", {
      sellerId,
      status: "completed",
    });

    res.json({
      success: true,
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
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.productViews = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const salesData = await Order.aggregate([
      {
        $match: {
          sellerId: new mongoose.Types.ObjectId(sellerId),
          status: "completed",
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const months = [
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

    const lifetimeValue = Array(12).fill(0);
    const customerCost = Array(12).fill(0);

    salesData.forEach((item) => {
      lifetimeValue[item._id - 1] = item.revenue;
      customerCost[item._id - 1] = Math.round(item.revenue * 0.3);
    });

    res.json({
      success: true,
      months,
      lifetimeValue,
      customerCost,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refundSummary = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const openRefunds = await Refund.countDocuments({
      sellerId,
      status: "pending",
    });

    const newRefunds = await Refund.countDocuments({
      sellerId,
      status: "pending",
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      openRefunds,
      newRefunds,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
