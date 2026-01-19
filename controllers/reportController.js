const Order = require("../models/Order");

/* ================= MONTHLY SALES (Bar Graph) ================= */
exports.salesReport = async (req, res) => {
  const sellerId = req.user._id;

  const report = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId, // ✅ correct field
        status: "completed",
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        totalSales: { $sum: "$totalAmount" },
        totalOrders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(report);
};

/* ================= WEEKLY / MONTHLY FILTER ================= */
exports.salesByRange = async (req, res) => {
  const sellerId = req.user._id;
  const { range } = req.query;

  let startDate = new Date();

  if (range === "weekly") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (range === "monthly") {
    startDate.setMonth(startDate.getMonth() - 1);
  }

  const data = await Order.aggregate([
    {
      $match: {
        sellerId: sellerId, // ✅ correct field
        status: "completed",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: { $dayOfMonth: "$createdAt" },
        totalSales: { $sum: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json(data);
};
