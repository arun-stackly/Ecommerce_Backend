const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const Product = require("../models/SellerInventory");
const Order = require("../models/UserOrder");

// ==========================================
// Sales Reports & Analytics
// GET /api/admin/sales-analytics
// ==========================================
exports.getSalesAnalytics = async (req, res) => {
  try {
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
      // Gross Revenue
      Order.aggregate([
        { $match: { "paymentDetails.paymentStatus": "paid" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]),

      // Total Orders
      Order.countDocuments(),

      // Total Product Views
      Product.aggregate([
        {
          $group: {
            _id: null,
            views: { $sum: "$views" },
          },
        },
      ]),

      // Refund / Return Orders
      Order.countDocuments({
        orderStatus: { $in: ["return", "cancelled"] },
      }),

      // Revenue vs Expenses (Monthly Revenue)
      Order.aggregate([
        { $match: { "paymentDetails.paymentStatus": "paid" } },
        {
          $group: {
            _id: { $month: "$createdAt" },
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Category Revenue
      Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "sellerinventories",
            localField: "items.sellerInventoryId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category.name",
            amount: { $sum: "$items.itemTotal" },
          },
        },
      ]),

      // Revenue by State
      Order.aggregate([
        {
          $group: {
            _id: "$shippingAddress.state",
            revenue: { $sum: "$totalAmount" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),

      // Top Categories
      Order.aggregate([
        { $unwind: "$items" },
        {
          $lookup: {
            from: "sellerinventories",
            localField: "items.sellerInventoryId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category",
          },
        },
        { $unwind: "$category" },
        {
          $group: {
            _id: "$category.name",
            orders: { $sum: "$items.quantity" },
            revenue: { $sum: "$items.itemTotal" },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]),
    ]);

    const grossRevenue = revenue[0]?.total || 0;
    const orders = totalOrders || 0;
    const views = totalViews[0]?.views || 0;

    const averageOrderValue =
      orders === 0 ? 0 : Number((grossRevenue / orders).toFixed(2));

    const conversionRate =
      views === 0 ? 0 : Number(((orders / views) * 100).toFixed(2));

    const refundRate =
      orders === 0
        ? 0
        : Number(((refundedOrders / orders) * 100).toFixed(2));

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

    res.status(200).json({
      success: true,

      summary: {
        grossRevenue,
        averageOrderValue,
        conversionRate,
        refundRate,
      },

      revenueVsExpenses: revenueChart.map((item) => ({
        month: months[item._id],
        revenue: item.revenue,
        expenses: 0, // add expense model later
      })),

      orderStatusOverview: categoryChart.map((item) => ({
        category: item._id,
        amount: item.amount,
      })),

      revenueByRegion: regionChart.map((item) => ({
        region: item._id || "Unknown",
        revenue: item.revenue,
      })),

   
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