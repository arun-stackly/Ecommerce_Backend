const Payment = require("../models/Payment");

/* ================= CREATE PAYMENT ================= */
exports.createPayment = async (req, res) => {
  const payment = await Payment.create({
    sellerId: req.user._id, // 🔐 from token
    orderId: req.body.orderId, // must be real Order _id
    amount: req.body.amount,
    method: req.body.method,
    status: req.body.status,
  });

  res.status(201).json(payment);
};

/* ================= GET SELLER PAYMENTS ================= */
exports.getPayments = async (req, res) => {
  const payments = await Payment.find({
    sellerId: req.user._id, // 🔐 filter by seller
  }).populate("orderId");

  res.json(payments);
};
