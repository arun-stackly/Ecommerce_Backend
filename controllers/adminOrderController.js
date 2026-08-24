const UserOrder = require("../models/UserOrder");

/**
 * GET /api/admin/orders/stats
 * Dashboard statistics
 */
const getOrderStats = async (req, res) => {
  try {
    const [
      totalOrders,
      deliveredOrders,
      pendingPayments,
      returnRequests,
    ] = await Promise.all([
      // Total orders
      UserOrder.countDocuments({}),

      // Delivered orders
      UserOrder.countDocuments({
        orderStatus: "delivered",
      }),

      // Pending payments
      UserOrder.countDocuments({
        "paymentDetails.paymentStatus": "pending",
      }),

      // Return requests
      UserOrder.countDocuments({
        $or: [
          { orderStatus: "return" },
          { "items.itemStatus": "return" },
        ],
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        deliveredOrders,
        pendingPayments,
        returnRequests,
      },
    });
  } catch (error) {
    console.error("Get order stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message,
    });
  }
};


/**
 * GET /api/admin/orders
 *
 * Query params:
 * page=1
 * limit=10
 * status=all
 * search=
 * paymentMode=
 * paymentStatus=
 * dateFrom=
 * dateTo=
 */
const getAdminOrders = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      status = "all",
      search = "",
      paymentMode,
      paymentStatus,
      dateFrom,
      dateTo,
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    const filter = {};

    /**
     * -----------------------------------------
     * STATUS FILTER
     * -----------------------------------------
     */
    if (status && status !== "all") {
      filter.orderStatus = status.toLowerCase();
    }

    /**
     * -----------------------------------------
     * SEARCH
     * Search by:
     * - Order ID
     * - Customer name
     * -----------------------------------------
     */
    if (search.trim()) {
      filter.$or = [
        {
          orderId: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          customerName: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    /**
     * -----------------------------------------
     * PAYMENT MODE FILTER
     * -----------------------------------------
     */
    if (paymentMode) {
      filter.paymentMode = paymentMode.toUpperCase();
    }

    /**
     * -----------------------------------------
     * PAYMENT STATUS FILTER
     * -----------------------------------------
     */
    if (paymentStatus) {
      filter["paymentDetails.paymentStatus"] =
        paymentStatus.toLowerCase();
    }

    /**
     * -----------------------------------------
     * DATE FILTER
     * -----------------------------------------
     */
    if (dateFrom || dateTo) {
      filter.createdAt = {};

      if (dateFrom) {
        const startDate = new Date(dateFrom);
        startDate.setHours(0, 0, 0, 0);

        filter.createdAt.$gte = startDate;
      }

      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);

        filter.createdAt.$lte = endDate;
      }
    }

    /**
     * -----------------------------------------
     * GET ORDERS + TOTAL COUNT
     * -----------------------------------------
     */
    const [orders, totalOrders] = await Promise.all([
      UserOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      UserOrder.countDocuments(filter),
    ]);

    /**
     * -----------------------------------------
     * FORMAT DATA FOR ADMIN TABLE
     * -----------------------------------------
     */
    const formattedOrders = orders.map((order) => ({
      _id: order._id,

      orderId: order.orderId,

      customer: {
        _id: order.customerId,
        name: order.customerName,
      },

      itemsCount: Array.isArray(order.items)
        ? order.items.reduce(
            (total, item) => total + (item.quantity || 0),
            0
          )
        : 0,

      paymentMode: order.paymentMode,

      paymentStatus:
        order.paymentDetails?.paymentStatus || "pending",

      amount: order.totalAmount || 0,

      status: order.orderStatus,

      date: order.createdAt,

      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    const totalPages = Math.ceil(totalOrders / limit);

    return res.status(200).json({
      success: true,

      data: formattedOrders,

      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,

        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get admin orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};
const searchOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !orderId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const searchValue = orderId.trim();

    // Search exact order ID
    const order = await UserOrder.findOne({
      orderId: {
        $regex: `^${searchValue}$`,
        $options: "i",
      },
    }).select(
      "_id orderId customerId customerName orderStatus createdAt items estimatedDeliveryDate deliveredAt shippingAddress billingAddress paymentMode paymentDetails totalItemsPrice platformFee discount totalAmount"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const formatted = {
      _id: order._id,
      orderId: order.orderId,

      customer: {
        _id: order.customerId,
        name: order.customerName,
      },

      orderStatus: order.orderStatus,
      createdAt: order.createdAt,

      estimatedDeliveryDate: order.estimatedDeliveryDate,
      deliveredAt: order.deliveredAt,

      paymentMode: order.paymentMode,

      paymentStatus:
        order.paymentDetails?.paymentStatus || "pending",

      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,

      totalItemsPrice: order.totalItemsPrice,
      platformFee: order.platformFee,
      discount: order.discount,
      totalAmount: order.totalAmount,

      products: (order.items || []).map((item) => ({
        itemId: item._id,
        productId: item.sellerInventoryId,
        sellerId: item.sellerId,

        name: item.name,
        image: item.image,

        quantity: item.quantity,
        size: item.size,
        colour: item.colour,

        price: item.price,
        itemTotal: item.itemTotal,

        itemStatus: item.itemStatus,
      })),
    };

    return res.status(200).json({
      success: true,
      count: 1,
      data: formatted,
    });
  } catch (error) {
    console.error("Search Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search order",
      error: error.message,
    });
  }
};

const getOrdersByStatusWithItems = async (req, res) => {
  try {
    const { status } = req.params;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Order status is required",
      });
    }

    const statusMap = {
      all: null,
      ordered: "ordered",
      processing: "processing",
      shipped: "shipped",
      delivered: "delivered",
      cancelled: "cancelled",
      exchange: "exchange",
      return: "return",
    };

    const normalizedStatus = status.toLowerCase();

    if (
      normalizedStatus !== "all" &&
      !statusMap.hasOwnProperty(normalizedStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
        allowedStatuses: Object.keys(statusMap),
      });
    }

    // -----------------------------------------
    // BUILD FILTER
    // -----------------------------------------

    const filter = {};

    if (normalizedStatus !== "all") {
      filter.orderStatus = statusMap[normalizedStatus];
    }

    // -----------------------------------------
    // GET ORDERS
    // -----------------------------------------

    const orders = await UserOrder.find(filter)
      .sort({ createdAt: -1 })
      .select(
        "_id orderId customerId customerName orderStatus createdAt items estimatedDeliveryDate deliveredAt shippingAddress billingAddress paymentMode paymentDetails totalItemsPrice platformFee discount totalAmount"
      )
      .lean();

    // -----------------------------------------
    // FORMAT RESPONSE
    // -----------------------------------------

    const formatted = orders.map((order) => ({
      _id: order._id,

      orderId: order.orderId,

      customer: {
        _id: order.customerId,
        name: order.customerName,
      },

      orderStatus: order.orderStatus,

      createdAt: order.createdAt,

      estimatedDeliveryDate:
        order.estimatedDeliveryDate,

      deliveredAt: order.deliveredAt,

      paymentMode: order.paymentMode,

      paymentStatus:
        order.paymentDetails?.paymentStatus || "pending",

      shippingAddress: order.shippingAddress,

      billingAddress: order.billingAddress,

      totalItemsPrice: order.totalItemsPrice,

      platformFee: order.platformFee,

      discount: order.discount,

      totalAmount: order.totalAmount,

      products: (order.items || []).map((item) => ({
        itemId: item._id,

        productId: item.sellerInventoryId,

        sellerId: item.sellerId,

        name: item.name,

        image: item.image,

        quantity: item.quantity,

        size: item.size,

        colour: item.colour,

        price: item.price,

        itemTotal: item.itemTotal,

        itemStatus: item.itemStatus,
      })),
    }));

    return res.status(200).json({
      success: true,

      status: normalizedStatus,

      count: formatted.length,

      data: formatted,
    });
  } catch (error) {
    console.error(
      "Get Orders By Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders by status",
      error: error.message,
    });
  }
};

module.exports = {
  getOrderStats,
  getAdminOrders,
  searchOrderById,
  getOrdersByStatusWithItems,
};
