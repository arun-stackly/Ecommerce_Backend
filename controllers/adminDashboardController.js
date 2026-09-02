const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const Product = require("../models/SellerInventory");
const Order = require("../models/UserOrder");
const Category = require("../models/Category");
 
/* ================= REVENUE FILTER CONFIG ================= */
 
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
 
/* ================= DASHBOARD ================= */
 
exports.getDashboard = async (req, res) => {
  try {
    const { filter = "monthly" } = req.query;
 
    // Validate filter
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
 
    /* ================= REVENUE START DATE ================= */
 
    const revenueStartDate = new Date(
      now.getFullYear(),
      now.getMonth() - totalMonths + 1,
      1,
    );
 
    const [
      customerCount,
      sellerCount,
      productCount,
      orderCount,
      revenue,
      totalVisits,
      revenueChart,
      categoryChart,
    ] = await Promise.all([
      /* ================= CUSTOMERS ================= */
 
      User.countDocuments({
        role: "seller",
      }),
 
      /* ================= SELLERS ================= */
 
      SellerProfile.countDocuments(),
 
      /* ================= PRODUCTS ================= */
 
      Product.countDocuments({
        isActive: true,
      }),
 
      /* ================= ORDERS ================= */
 
      Order.countDocuments(),
 
      /* ================= TOTAL REVENUE ================= */
 
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
 
      /* ================= TOTAL PRODUCT VIEWS ================= */
 
      Product.aggregate([
        {
          $match: {
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$views",
            },
          },
        },
      ]),
 
      /* ================= REVENUE OVERVIEW ================= */
 
      Order.aggregate([
        {
          $match: {
            "paymentDetails.paymentStatus": "paid",
            createdAt: {
              $gte: revenueStartDate,
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
 
      /* ================= REVENUE BY CATEGORY ================= */
 
      Order.aggregate([
        {
          $match: {
            "paymentDetails.paymentStatus": "paid",
            createdAt: {
              $gte: revenueStartDate,
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
      ]),
    ]);
 
    /* ================= MONTH NAMES ================= */
 
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
 
    /* ================= FORMAT REVENUE ================= */
 
    const formattedRevenue = [];
 
    for (let i = totalMonths - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
 
      const monthNumber = date.getMonth() + 1;
      const year = date.getFullYear();
 
      const found = revenueChart.find(
        (item) => item._id.month === monthNumber && item._id.year === year,
      );
 
      formattedRevenue.push({
        period: `${monthNames[monthNumber - 1]}/${year}`,
        month: monthNames[monthNumber - 1],
        year: year,
        revenue: found ? found.revenue : 0,
      });
    }
 
    /* ================= RESPONSE ================= */
 
    res.json({
      success: true,
 
      filter,
 
      summary: {
        revenue: revenue[0]?.total || 0,
        orders: orderCount,
        customers: customerCount,
        sellers: sellerCount,
        products: productCount,
        visits: totalVisits[0]?.total || 0,
      },
 
      revenueOverview: formattedRevenue,
 
      orderStatusOverview: categoryChart.map((item) => ({
        category: item._id,
        amount: item.amount,
      })),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
 
/* ================= RECENT ORDERS ================= */
 
exports.getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "firstName lastName")
      .sort({ createdAt: -1 });
 
    const formatted = orders.map((order) => ({
      orderId: order.orderId,
 
      customer: order.customerId
        ? `${order.customerId.firstName} ${order.customerId.lastName}`
        : order.customerName,
 
      amount: order.totalAmount,
 
      status: order.orderStatus,
 
      date: order.createdAt,
    }));
 
    res.json({
      success: true,
      orders: formatted,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
 
/* ================= TOP PRODUCTS ================= */
 
exports.getTopProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
 
      {
        $sort: {
          soldCount: -1,
        },
      },
    ]);
 
    const result = await Promise.all(
      products.map(async (product) => {
        const revenue = await Order.aggregate([
          {
            $unwind: "$items",
          },
 
          {
            $match: {
              "items.sellerInventoryId": product._id,
            },
          },
 
          {
            $group: {
              _id: null,
 
              totalRevenue: {
                $sum: "$items.itemTotal",
              },
            },
          },
        ]);
 
        return {
          name: product.name,
 
          sold: product.soldCount,
 
          revenue: revenue[0]?.totalRevenue || 0,
 
          image: product.media?.[0]?.url || "",
        };
      }),
    );
 
    res.json({
      success: true,
      products: result,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
 
/* ================= TOP CATEGORIES ================= */
 
exports.getTopCategories = async (req, res) => {
  try {
    const categories = await Order.aggregate([
      /* 1. Only paid orders */
 
      {
        $match: {
          "paymentDetails.paymentStatus": "paid",
        },
      },
 
      /* 2. Separate each order item */
 
      {
        $unwind: "$items",
      },
 
      /* 3. Get product details */
 
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
 
      /* 4. Get category details */
 
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
 
      /* 5. Group by category */
 
      {
        $group: {
          _id: "$category._id",
 
          category: {
            $first: "$category.name",
          },
 
          orderIds: {
            $addToSet: "$_id",
          },
 
          revenue: {
            $sum: {
              $ifNull: ["$items.itemTotal", 0],
            },
          },
        },
      },
 
      /* 6. Format response */
 
      {
        $project: {
          _id: 0,
 
          category: 1,
 
          orders: {
            $size: "$orderIds",
          },
 
          revenue: 1,
        },
      },
 
      /* 7. Highest revenue first */
 
      {
        $sort: {
          revenue: -1,
        },
      },
 
      /* Top 10 categories */
 
      {
        $limit: 10,
      },
    ]);
 
    res.status(200).json({
      success: true,
      categories,
    });
  } catch (err) {
    console.error("TOP CATEGORY ERROR:", err);
 
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
 
 