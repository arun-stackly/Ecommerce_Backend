const Payment = require("../models/Payment");
const UserOrder = require("../models/UserOrder");

/* ================= CREATE PAYMENT ================= */

exports.createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;

    const order = await UserOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    const payment = await Payment.create({
      customerId: req.user._id,
      orderId,
      amount: order.totalAmount,
      method,
      status: method === "COD" ? "success" : "pending",
    });

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/* ================= VERIFY PAYMENT ================= */

exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, transactionId } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    payment.status = "success";
    payment.transactionId = transactionId;

    await payment.save();

    const order = await UserOrder.findById(payment.orderId);

    order.paymentStatus = "paid";

    await order.save();

    res.json({
      success: true,
      message: "Payment successful",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
