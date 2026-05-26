const Refund = require("../models/Refund");

/* ================= CREATE REFUND ================= */
exports.createRefund = async (req, res) => {
  const refund = await Refund.create({
    sellerId: req.user._id,
    orderId: req.body.orderId,
    amount: req.body.amount,
    reason: req.body.reason,
  });

  res.status(201).json(refund);
};

/* ================= GET SELLER REFUNDS (REFUNDS PAGE) ================= */
exports.getRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({
      sellerId: req.user._id,
    })
      .populate({
        path: "orderId",
        select: "orderId createdAt status totalAmount inventorySnapshot",
      })
      .sort({ createdAt: -1 });

    const formattedRefunds = refunds.map((r) => ({
      refundId: r._id,

      orderId: r.orderId.orderId,
      orderDate: r.orderId.createdAt,
      orderStatus: r.orderId.status,

      product: {
        name: r.orderId.inventorySnapshot.name,
        image: r.orderId.inventorySnapshot.image,
      },

      price: r.amount,
      refundStatus: r.status,
      reason: r.reason,
    }));

    res.json(formattedRefunds);
  } catch (error) {
    console.error("Get Refunds Error:", error);
    res.status(500).json({ message: "Server error" });
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

/* =========================================================
   NEW: GET REFUND PROCESSING PAGE DATA
   (Used to load refund processing screen)
========================================================= */
exports.getRefundProcessingData = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id).populate({
      path: "orderId",
      select:
        "orderId createdAt status totalAmount shippingAmount inventorySnapshot",
    });

    if (!refund) return res.status(404).json({ message: "Refund not found" });

    res.json({
      refundId: refund._id,
      status: refund.status,
      reason: refund.reason,
      requestedAmount: refund.amount,

      product: refund.orderId.inventorySnapshot,

      orderSummary: {
        orderId: refund.orderId.orderId,
        orderDate: refund.orderId.createdAt,
        totalAmount: refund.orderId.totalAmount,
        shippingAmount: refund.orderId.shippingAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================================
   NEW: PROCESS REFUND (Submit Refund Button)
========================================================= */
exports.processRefund = async (req, res) => {
  try {
    const { amount, returnShippingCharge, additionalRefund, note, status } =
      req.body;

    const refund = await Refund.findById(req.params.id);

    if (!refund) return res.status(404).json({ message: "Refund not found" });

    refund.amount = amount;
    refund.returnShippingCharge = returnShippingCharge || 0;
    refund.additionalRefund = additionalRefund || 0;
    refund.note = note;
    refund.status = status || "approved";

    await refund.save();

    res.json({
      success: true,
      message: "Refund processed successfully",
      refund,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
