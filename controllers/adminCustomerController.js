const UserAuth = require("../models/UserAuth");
const UserOrder = require("../models/UserOrder");

/* =====================================================
   GET CUSTOMER MANAGEMENT SUMMARY
   ===================================================== */
exports.getCustomerManagement = async (req, res) => {
  try {
    // Get all customers
    const customers = await UserAuth.find({})
      .select("firstName lastName phone email createdAt")
      .lean();

    // Get customer order statistics
    const orderStats = await UserOrder.aggregate([
      {
        $match: {
          orderStatus: { $ne: "cancelled" }
        }
      },
      {
        $group: {
          _id: "$customerId",

          // Number of orders
          orders: {
            $sum: 1
          },

          // Total amount spent
          lifetimeSpend: {
            $sum: {
              $ifNull: ["$totalAmount", 0]
            }
          }
        }
      }
    ]);

    // Convert order stats into a Map
    const orderStatsMap = new Map();

    orderStats.forEach((item) => {
      orderStatsMap.set(item._id.toString(), {
        orders: item.orders,
        lifetimeSpend: item.lifetimeSpend
      });
    });

    // Prepare customer response
    const customerDetails = customers.map((customer) => {
      const stats = orderStatsMap.get(customer._id.toString());

      return {
        id: customer._id,

        name: `${customer.firstName || ""} ${
          customer.lastName || ""
        }`.trim(),

        phoneNumber: customer.phone || "",

        email: customer.email || "",

        orders: stats?.orders || 0,

        lifetimeSpend: stats?.lifetimeSpend || 0,

        joinedDate: customer.createdAt
      };
    });

    res.status(200).json({
      success: true,

      totalCustomers: customers.length,

      customers: customerDetails
    });
  } catch (error) {
    console.error("Get customer management error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customer management data",
      error: error.message
    });
  }
};