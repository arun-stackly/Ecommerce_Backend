const Refund = require("../models/Refund");

/* ================= CREATE REFUND ================= */
exports.createRefund = async (req, res) => {
  const refund = await Refund.create({
    sellerId: req.user._id, // ✅ correct
    orderId: req.body.orderId,
    amount: req.body.amount,
    reason: req.body.reason,
  });

  res.status(201).json(refund);
};

/* ================= GET SELLER REFUNDS ================= */
exports.getRefunds = async (req, res) => {
  const refunds = await Refund.find({
    sellerId: req.user._id, // ✅ correct
  }).sort({ createdAt: -1 });

  res.json(refunds);
};
