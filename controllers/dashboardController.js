const mongoose = require("mongoose");
const UserOrder = require("../models/UserOrder");
const Refund = require("../models/Refund");
const SellerInventory = require("../models/SellerInventory");
 
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
 
    const sellerFilter = {
      "items.sellerId": new mongoose.Types.ObjectId(sellerId),
    };
 
    const completedMatch = {
      ...sellerFilter,
      orderStatus: "delivered",
    };
 
    if (startDate) {
      completedMatch.createdAt = { $gte: startDate };
    }
 
    const [totalOrders, completedOrders, pendingOrders, revenue, customers] =
      await Promise.all([
        UserOrder.countDocuments(sellerFilter),
 
        UserOrder.countDocuments({
          ...sellerFilter,
          orderStatus: "delivered",
        }),
 
        UserOrder.countDocuments({
          ...sellerFilter,
          orderStatus: "ordered",
        }),
 
        UserOrder.aggregate([
          { $match: completedMatch },
          {
            $group: {
              _id: null,
              total: { $sum: "$totalAmount" },
            },
          },
        ]),
 
        UserOrder.distinct("customerId", completedMatch),
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
 
/* ================= PRODUCT VIEWS ================= */
 
exports.productViews = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { filter = "anytime" } = req.query;
 
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
      "items.sellerId": new mongoose.Types.ObjectId(sellerId),
      orderStatus: "delivered",
    };
 
    if (startDate) {
      matchStage.createdAt = { $gte: startDate };
    }
 
    const salesData = await UserOrder.aggregate([
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
 
/* ================= STOCK ALERTS ================= */
 
exports.stockAlerts = async (req, res) => {
  try {
    const sellerId = req.user._id;
 
    const alerts = await SellerInventory.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          listingStatus: {
            $cond: ["$isActive", "Active", "Inactive"],
          },
          stockStatus: {
            $switch: {
              branches: [
                {
                  case: { $eq: ["$quantity", 0] },
                  then: "No Stock",
                },
                {
                  case: { $lte: ["$quantity", 5] },
                  then: "Low Stock",
                },
              ],
              default: "In Stock",
            },
          },
        },
      },
      {
        $match: {
          stockStatus: {
            $in: ["Low Stock", "No Stock"],
          },
        },
      },
      {
        $project: {
          _id: 1,
          productName: "$name",
          category: "$category.name",
          listingStatus: 1,
          unitsSold: "$soldCount",
          itemStock: "$quantity",
          stockStatus: 1,
          price: 1,
        },
      },
      {
        $sort: {
          itemStock: 1,
        },
      },
    ]);
 
    res.status(200).json({
      success: true,
      totalAlerts: alerts.length,
      alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 