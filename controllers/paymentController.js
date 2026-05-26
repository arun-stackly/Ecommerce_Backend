const Payment = require("../models/Payment");
const UserOrder = require("../models/UserOrder");

/* ================= CREATE PAYMENT ================= */

exports.createPayment = async (req, res) => {
  try {
    const { orderId, method } = req.body;

    const order = await UserOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const isCOD = method === "COD";

    const payment = await Payment.create({
      customerId: req.user._id,
      orderId,
      amount: order.totalAmount,
      method,
      status: isCOD ? "success" : "pending",
    });

    let message = "";
    let feeInfo = null;

    if (isCOD) {
      message = "COD selected. Order will be delivered to your address.";
      feeInfo = "A fee of ₹20 is applicable for this option. online payment will help you avoid this fee";
    } else {
      message =
        "Online payment selected. You can avoid ₹20 COD fee by paying online.";
    }

    res.json({
      success: true,
      payment,
      message,
      feeInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
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



/* ======================================================
   CARD PAYMENT API
====================================================== */
 
exports.cardPayment = async (req, res) => {
  try {
    const { orderId, cardNumber, cardHolderName, expiry, cvv } = req.body;
 
    /* ================= VALIDATION ================= */
 
    if (!orderId || !cardNumber || !cardHolderName || !expiry || !cvv) {
      return res.status(400).json({
        success: false,
        message: "All card fields are required",
      });
    }
 
    /* ================= FIND ORDER ================= */
 
    const order = await UserOrder.findById(orderId);
 
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
 
    /* ================= CREATE PAYMENT ================= */
 
    const payment = await Payment.create({
      customerId: req.user._id,
 
      orderId,
 
      amount: order.totalAmount,
 
      method: "CARD",
 
      status: "pending",
 
      transactionId: "TXN" + Date.now(),
 
      otp: "123456",
    });
 
    /* ================= RESPONSE ================= */
 
    res.json({
      success: true,
 
      message: "OTP sent successfully",
 
      paymentId: payment._id,
 
      cardData: {
        cardNumber: "************" + cardNumber.slice(-4),
 
        merchant: "The Stackly",
 
        amount: order.totalAmount,
      },
 
      // REMOVE IN PRODUCTION
      testOtp: "123456",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* ======================================================
   VERIFY CARD PAYMENT OTP
====================================================== */
 
exports.verifyCardPayment = async (req, res) => {
  try {
    const { paymentId, otp } = req.body;
 
    const payment = await Payment.findById(paymentId);
 
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }
 
    /* ================= VERIFY OTP ================= */
 
    if (payment.otp !== otp) {
      payment.status = "failed";
 
      await payment.save();
 
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
 
    /* ================= SUCCESS ================= */
 
    payment.status = "success";
 
    await payment.save();
 
    const order = await UserOrder.findById(payment.orderId);
 
    order.paymentStatus = "paid";
 
    await order.save();
 
    res.json({
      success: true,
      message: "Card payment successful",
 
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 