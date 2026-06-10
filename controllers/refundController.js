const Refund = require("../models/Refund");
 
/* ================= CREATE REFUND ================= */
exports.createRefund = async (req, res) => {
  try {
    const refund = await Refund.create({
      sellerId: req.user._id,
      orderId: req.body.orderId,
      amount: req.body.amount,
      reason: req.body.reason,
    });
 
    res.status(201).json(refund);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* ================= GET SELLER REFUNDS ================= */
exports.getRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({
      sellerId: req.user._id,
    })
      .populate({
        path: "orderId",
        select: "orderId createdAt orderStatus totalAmount paymentMode items",
      })
      .sort({ createdAt: -1 });
 
    const formattedRefunds = refunds
      .filter((refund) => refund.orderId)
      .map((refund) => ({
        refundId: refund._id,
 
        orderId: refund.orderId.orderId,
        orderDate: refund.orderId.createdAt,
        orderStatus: refund.orderId.orderStatus,
 
        product: {
          name: refund.orderId.items?.[0]?.name || "",
          image: refund.orderId.items?.[0]?.image || "",
          quantity: refund.orderId.items?.[0]?.quantity || 0,
        },
 
        amount: refund.amount,
        refundStatus: refund.status,
        reason: refund.reason,
 
        createdAt: refund.createdAt,
      }));
 
    res.json({
      success: true,
      count: formattedRefunds.length,
      refunds: formattedRefunds,
    });
  } catch (error) {
    console.error("Get Refunds Error:", error);
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
      Refund.countDocuments({
        sellerId,
        status: "pending",
      }),
 
      Refund.countDocuments({
        sellerId,
        status: "pending",
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),
 
      Refund.countDocuments({ sellerId }),
 
      Refund.countDocuments({
        sellerId,
        status: "approved",
      }),
 
      Refund.countDocuments({
        sellerId,
        status: "rejected",
      }),
 
      Refund.aggregate([
        {
          $match: {
            sellerId,
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
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
 
/* ================= REFUND PROCESSING PAGE ================= */
exports.getRefundProcessingData = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id).populate({
      path: "orderId",
      select:
        "orderId createdAt orderStatus totalAmount paymentMode customerName items",
    });
 
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }
 
    if (!refund.orderId) {
      return res.status(404).json({
        success: false,
        message: "Associated order not found",
      });
    }
 
    res.json({
      success: true,
 
      refundId: refund._id,
      status: refund.status,
      reason: refund.reason,
      requestedAmount: refund.amount,
 
      product: refund.orderId.items?.[0] || {},
 
      orderSummary: {
        orderId: refund.orderId.orderId,
        orderDate: refund.orderId.createdAt,
        orderStatus: refund.orderId.orderStatus,
        totalAmount: refund.orderId.totalAmount,
        paymentMode: refund.orderId.paymentMode,
        customerName: refund.orderId.customerName,
      },
 
      refundDetails: {
        returnShippingCharge: refund.returnShippingCharge,
        additionalRefund: refund.additionalRefund,
        note: refund.note,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* ================= PROCESS REFUND ================= */
exports.processRefund = async (req, res) => {
  try {
    const { amount, returnShippingCharge, additionalRefund, note, status } =
      req.body;
 
    const refund = await Refund.findById(req.params.id);
 
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }
 
    refund.amount = amount;
    refund.returnShippingCharge = returnShippingCharge || 0;
    refund.additionalRefund = additionalRefund || 0;
    refund.note = note || "";
    refund.status = status || "approved";
 
    await refund.save();
 
    res.json({
      success: true,
      message: "Refund processed successfully",
      refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 