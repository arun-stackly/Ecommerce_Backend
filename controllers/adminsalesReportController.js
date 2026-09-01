const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const Product = require("../models/SellerInventory");
const Order = require("../models/UserOrder");
 
// ==========================================
// Sales Reports & Analytics
// GET /api/admin/sales-analytics
// ==========================================
 
const ALLOWED_FILTERS = ["monthly", "quarterly", "halfyearly", "yearly"];
 
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
 
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { filter = "monthly" } = req.query;
 
    if (!validateFilter(filter, res)) return;
 
    const now = new Date();
 
    let totalMonths;
 
    switch (filter) {
      case "monthly":
        totalMonths = 1;
        break;
 
      case "quarterly":
        totalMonths = 3;
        break;
 
      case "halfyearly":
        totalMonths = 6;
        break;
 
      case "yearly":
        totalMonths = 12;
        break;
 
      default:
        totalMonths = 1;
    }
 
    // Start date based on selected filter
    const startDate = new Date(
      now.getFullYear(),
      now.getMonth() - totalMonths + 1,
      1,
    );
 
    const [
      revenue,
      totalOrders,
      totalViews,
      refundedOrders,
      revenueChart,
      categoryChart,
      regionChart,
      topCategories,
    ] = await Promise.all([
      // ==========================================
      // Gross Revenue
      // ==========================================
 
      Order.aggregate([
        {
          $match: {
            "paymentDetails.paymentStatus": "paid",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),
 
      // ==========================================
      // Total Orders
      // ==========================================
 
      Order.countDocuments(),
 
      // ==========================================
      // Total Product Views
      // ==========================================
 
      Product.aggregate([
        {
          $group: {
            _id: null,
            views: {
              $sum: "$views",
            },
          },
        },
      ]),
 
      // ==========================================
      // Refund / Return Orders
      // ==========================================
 
      Order.countDocuments({
        orderStatus: {
          $in: ["return", "cancelled"],
        },
      }),
 
      // ==========================================
      // Revenue vs Expenses
      // ==========================================
 
      Order.aggregate([
        {
          $match: {
            "paymentDetails.paymentStatus": "paid",
            createdAt: {
              $gte: startDate,
            },
          },
        },
 
        {
          $group: {
            _id: {
              year: {
                $year: "$createdAt",
              },
 
              month: {
                $month: "$createdAt",
              },
            },
 
            revenue: {
              $sum: "$totalAmount",
            },
          },
        },
 
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),
 
      // ==========================================
      // Category Revenue
      // FILTERED BASED ON SELECTED PERIOD
      // ==========================================
 
      Order.aggregate([
        {
          $match: {
            "paymentDetails.paymentStatus": "paid",
            createdAt: {
              $gte: startDate,
            },
          },
        },
 
        {
          $unwind: "$items",
        },
 
        {
          $lookup: {
            from: "sellerinventories",
            localField: "items.sellerInventoryId",
            foreignField: "_id",
            as: "product",
          },
        },
 
        {
          $unwind: "$product",
        },
 
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
 
        {
          $unwind: "$category",
        },
 
        {
          $group: {
            _id: "$category.name",
 
            amount: {
              $sum: "$items.itemTotal",
            },
          },
        },
 
        {
          $sort: {
            amount: -1,
          },
        },
      ]),
 
      // ==========================================
      // Revenue by State
      // UNCHANGED
      // ==========================================
 
      Order.aggregate([
        {
          $group: {
            _id: "$shippingAddress.state",
 
            revenue: {
              $sum: "$totalAmount",
            },
          },
        },
 
        {
          $sort: {
            revenue: -1,
          },
        },
      ]),
 
      // ==========================================
      // Top Categories
      // UNCHANGED
      // ==========================================
 
      Order.aggregate([
        {
          $unwind: "$items",
        },
 
        {
          $lookup: {
            from: "sellerinventories",
            localField: "items.sellerInventoryId",
            foreignField: "_id",
            as: "product",
          },
        },
 
        {
          $unwind: "$product",
        },
 
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
 
        {
          $unwind: "$category",
        },
 
        {
          $group: {
            _id: "$category.name",
 
            orders: {
              $sum: "$items.quantity",
            },
 
            revenue: {
              $sum: "$items.itemTotal",
            },
          },
        },
 
        {
          $sort: {
            revenue: -1,
          },
        },
 
        {
          $limit: 5,
        },
      ]),
    ]);
 
    // ==========================================
    // Summary
    // ==========================================
 
    const grossRevenue = revenue[0]?.total || 0;
 
    const orders = totalOrders || 0;
 
    const views = totalViews[0]?.views || 0;
 
    const averageOrderValue =
      orders === 0 ? 0 : Number((grossRevenue / orders).toFixed(2));
 
    const conversionRate =
      views === 0 ? 0 : Number(((orders / views) * 100).toFixed(2));
 
    const refundRate =
      orders === 0 ? 0 : Number(((refundedOrders / orders) * 100).toFixed(2));
 
    // ==========================================
    // Month Names
    // ==========================================
 
    const months = [
      "",
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
 
    // ==========================================
    // Format Revenue Chart
    // ==========================================
 
    const formattedRevenueVsExpenses = [];
 
    for (let i = totalMonths - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
 
      const monthNumber = date.getMonth() + 1;
 
      const year = date.getFullYear();
 
      const found = revenueChart.find(
        (item) => item._id.month === monthNumber && item._id.year === year,
      );
 
      formattedRevenueVsExpenses.push({
        period: `${months[monthNumber]}/${year}`,
        month: months[monthNumber],
        year: year,
        revenue: found ? found.revenue : 0,
        expenses: 0,
      });
    }
 
    // ==========================================
    // Response
    // ==========================================
 
    res.status(200).json({
      success: true,
 
      filter,
 
      summary: {
        grossRevenue,
        averageOrderValue,
        conversionRate,
        refundRate,
      },
 
      revenueVsExpenses: formattedRevenueVsExpenses,
 
      // FILTERED ORDER STATUS OVERVIEW
      orderStatusOverview: categoryChart.map((item) => ({
        category: item._id,
        amount: item.amount,
      })),
 
      // UNCHANGED
      revenueByRegion: regionChart.map((item) => ({
        region: item._id || "Unknown",
        revenue: item.revenue,
      })),
 
      // UNCHANGED
      topCategories: topCategories.map((item) => ({
        category: item._id,
        orders: item.orders,
        revenue: item.revenue,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
// ==========================================
// Export Placeholder
// GET /api/admin/sales-analytics/export
// ==========================================
 
exports.exportSalesReport = async (req, res) => {
  try {
    const { type = "excel" } = req.query;
 
    res.status(200).json({
      success: true,
      message: `Sales report export (${type}) will be implemented.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 