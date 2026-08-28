const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const Product = require("../models/SellerInventory");
const Order = require("../models/UserOrder");
const Category = require("../models/Category");

exports.getDashboard = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(1);

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

  // Sellers are stored in User model
  User.countDocuments({ role: "seller" }),

  // Seller profiles
  SellerProfile.countDocuments(),

  Product.countDocuments({ isActive: true }),

  Order.countDocuments(),

  // Total Revenue
  Order.aggregate([
    { $match: { "paymentDetails.paymentStatus": "paid" } },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalAmount" }
      }
    }
  ]),
  // Total Product Views
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            total: { $sum: "$views" },
          },
        },
      ]),
//   Product.countDocuments({ quantity: { $lte: 10 } }),

  // Monthly Revenue
  Order.aggregate([
    { $match: { "paymentDetails.paymentStatus": "paid" } },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$totalAmount" }
      }
    },
    { $sort: { "_id": 1 } }
  ]),

  // Revenue by Category
  Order.aggregate([
    { $unwind: "$items" },
    {
      $lookup: {
        from: "sellerinventories",
        localField: "items.sellerInventoryId",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category"
      }
    },
    { $unwind: "$category" },
    {
      $group: {
        _id: "$category.name",
        amount: { $sum: "$items.itemTotal" }
      }
    }
  ]),

//   Order.countDocuments({ orderStatus: "ordered" }),

//   Order.countDocuments({ orderStatus: "return" })
]);
    res.json({
      success: true,

      summary: {
        revenue: revenue[0]?.total || 0,
        orders: orderCount,
        customers: customerCount,
        sellers: sellerCount,
        products: productCount,
        visits: totalVisits[0]?.total || 0,
      },

    //   systemOverview: {
    //     activeUsers: customerCount,
    //     activeSellers: sellerCount,
    //     lowStockProducts: lowStock,
    //     pendingOrders: await Order.countDocuments({
    //       orderStatus: "Pending"
    //     }),
    //     refundRequests: await Order.countDocuments({
    //       orderStatus: "Returned"
    //     })
    //   },

      revenueOverview: revenueChart.map(item => ({
        month: item._id,
        revenue: item.revenue
      })),

      orderStatusOverview: categoryChart.map(item => ({
        category: item._id,
        amount: item.amount
      }))
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
exports.getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customerId", "firstName lastName")
      .sort({ createdAt: -1 })
     

    const formatted = orders.map(order => ({
      orderId: order.orderId,
      customer: order.customerId
        ? `${order.customerId.firstName} ${order.customerId.lastName}`
        :order.customerName,
      amount: order.totalAmount,
      status: order.orderStatus,
      date: order.createdAt,
    }));

    res.json({
      success: true,
      orders: formatted,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.getTopProducts = async (req, res) => {
  try {
    const products = await Product.aggregate([
      { $match: { isActive: true } },
      { $sort: { soldCount: -1 } },
      
    ]);

    const result = await Promise.all(
      products.map(async (product) => {
        const revenue = await Order.aggregate([
          { $unwind: "$items" },
          {
            $match: {
              "items.sellerInventoryId": product._id
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: "$items.itemTotal" }
            }
          }
        ]);

        return {
          name: product.name,
          sold: product.soldCount,
          revenue: revenue[0]?.totalRevenue || 0,
          image: product.media?.[0]?.url || ""
        };
      })
    );

    res.json({
      success: true,
      products: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
exports.getTopCategories = async (req, res) => {
  try {
    const categories = await Order.aggregate([

      // 1. Only paid orders
      {
        $match: {
          "paymentDetails.paymentStatus": "paid"
        }
      },

      // 2. Separate each order item
      {
        $unwind: "$items"
      },

      // 3. Get product details
      {
        $lookup: {
          from: "sellerinventories",
          localField: "items.sellerInventoryId",
          foreignField: "_id",
          as: "product"
        }
      },

      {
        $unwind: "$product"
      },

      // 4. Get category details
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category"
        }
      },

      {
        $unwind: "$category"
      },

      // 5. Group by category
      {
        $group: {
          _id: "$category._id",

          category: {
            $first: "$category.name"
          },

          // Unique orders in this category
          orderIds: {
            $addToSet: "$_id"
          },

          // Total category revenue
          revenue: {
            $sum: {
              $ifNull: [
                "$items.itemTotal",
                0
              ]
            }
          }
        }
      },

      // 6. Format response
      {
        $project: {
          _id: 0,

          category: 1,

          orders: {
            $size: "$orderIds"
          },

          revenue: 1
        }
      },

      // 7. Highest revenue first
      {
        $sort: {
          revenue: -1
        }
      },

      // Top 10 categories
      {
        $limit: 10
      }

    ]);

    res.status(200).json({
      success: true,
      categories
    });

  } catch (err) {

    console.error("TOP CATEGORY ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message
    });

  }
};