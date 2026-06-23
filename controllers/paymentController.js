const Payment = require("../models/Payment");
const UserOrder = require("../models/UserOrder");
const Cart = require("../models/cartModel");

/* ================= CREATE PAYMENT ================= */

exports.createPayment = async (req, res) => {
  try {
    const {
      paymentMode,
      paymentMethodId,
    } = req.body;

    const cart = await Cart.findOne({
      userId: req.user._id,
    });

    if (!cart || !cart.sellerGroups.length) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const payment = await Payment.create({
      customerId: req.user._id,
      amount: cart.priceDetails.totalAmount,
      method: paymentMode,
      paymentMethodId,
      status:
        paymentMode === "COD"
          ? "success"
          : "pending",
    });

    /* ================= MESSAGE LOGIC ================= */

    let message = "";
    let feeInfo = null;

    if (paymentMode === "COD") {
      message =
        "COD selected. Order will be delivered to your address.";

      feeInfo =
        "A fee of ₹20 is applicable for this option. Online payment will help you avoid this fee";
    } else {
      message =
        "Online payment selected. No COD fee will be charged.";

      feeInfo =
        "Payment will be processed securely using your selected payment method.";
    }

    /* ================= RESPONSE ================= */

    return res.json({
      success: true,
      paymentId: payment._id,
      amount: payment.amount,
      paymentStatus: payment.status,
      message,
      feeInfo,
    });
  } catch (error) {
    return res.status(500).json({
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
        success: false,
        message: "Payment not found",
      });
    }

    payment.status = "success";
    payment.transactionId = transactionId;

    await payment.save();

    return res.json({
      success: true,
      message: "Payment successful",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.verifyPayments = async (req, res) => {
  try {
    const { paymentId } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    payment.status = "success";
    payment.transactionId = "TXN" + Date.now();

    await payment.save();

    return res.json({
      success: true,
      message: "Payment successful",
      transactionId: payment.transactionId,
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// /* ======================================================
//    CARD PAYMENT API
// ====================================================== */
 
// exports.cardPayment = async (req, res) => {
//   try {
//     const { orderId, cardNumber, cardHolderName, expiry, cvv } = req.body;
 
//     /* ================= VALIDATION ================= */
 
//     if (!orderId || !cardNumber || !cardHolderName || !expiry || !cvv) {
//       return res.status(400).json({
//         success: false,
//         message: "All card fields are required",
//       });
//     }
 
//     /* ================= FIND ORDER ================= */
 
//     const order = await UserOrder.findById(orderId);
 
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }
 
//     /* ================= CREATE PAYMENT ================= */
 
//     const payment = await Payment.create({
//       customerId: req.user._id,
 
//       orderId,
 
//       amount: order.totalAmount,
 
//       method: "CARD",
 
//       status: "pending",
 
//       transactionId: "TXN" + Date.now(),
 
//       otp: "123456",
//     });
 
//     /* ================= RESPONSE ================= */
 
//     res.json({
//       success: true,
 
//       message: "OTP sent successfully",
 
//       paymentId: payment._id,
 
//       cardData: {
//         cardNumber: "************" + cardNumber.slice(-4),
 
//         merchant: "The Stackly",
 
//         amount: order.totalAmount,
//       },
 
//       // REMOVE IN PRODUCTION
//       testOtp: "123456",
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
 
// /* ======================================================
//    VERIFY CARD PAYMENT OTP
// ====================================================== */
 
// exports.verifyCardPayment = async (req, res) => {
//   try {
//     const { paymentId, otp } = req.body;
 
//     const payment = await Payment.findById(paymentId);
 
//     if (!payment) {
//       return res.status(404).json({
//         success: false,
//         message: "Payment not found",
//       });
//     }
 
//     /* ================= VERIFY OTP ================= */
 
//     if (payment.otp !== otp) {
//       payment.status = "failed";
 
//       await payment.save();
 
//       return res.status(400).json({
//         success: false,
//         message: "Invalid OTP",
//       });
//     }
 
//     /* ================= SUCCESS ================= */
 
//     payment.status = "success";
 
//     await payment.save();
 
//     const order = await UserOrder.findById(payment.orderId);
 
//     order.paymentStatus = "paid";
 
//     await order.save();
 
//     res.json({
//       success: true,
//       message: "Card payment successful",
 
//       payment,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };
 
 