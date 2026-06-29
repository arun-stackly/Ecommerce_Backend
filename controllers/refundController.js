const Refund = require("../models/Refund");
const ReturnRequest = require("../models/Return");
const UserOrder = require("../models/UserOrder");
const UserBank = require("../models/UserBank");
 
exports.createRefund = async (req, res) => {
  try {
    const {
      returnRequestId,
      refundMode,
      bankAccountId,
    } = req.body;

    const returnRequest = await ReturnRequest.findById(
      returnRequestId
    );

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    const order = await UserOrder.findById(
      returnRequest.orderId
    );

    const returnedItem = order.items.find(
      (item) =>
        item._id.toString() ===
        returnRequest.itemId.toString()
    );

    if (!returnedItem) {
      return res.status(404).json({
        success: false,
        message: "Returned item not found",
      });
    }

    const refundAmount =
  Number(
    returnedItem.itemTotal ||
    returnedItem.price * returnedItem.quantity
  );

    let bankDetails = {};

    if (refundMode === "BANK_ACCOUNT") {
      const bank = await UserBank.findOne({
        _id: bankAccountId,
        user: returnRequest.userId,
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Bank account not found",
        });
      }

      bankDetails = {
        accountHolderName:
          bank.accountHolderName,
        bankName: bank.bankName,
        accountNumber:
          bank.accountNumber,
        ifscCode: bank.ifscCode,
        state: bank.state,
      };
    }

    if (refundMode === "UPI") {
      const bank = await UserBank.findOne({
        _id: bankAccountId,
        user: returnRequest.userId,
      });

      if (!bank || !bank.upiId) {
        return res.status(404).json({
          success: false,
          message: "UPI account not found",
        });
      }

      bankDetails = {
        accountHolderName:
          bank.accountHolderName,
        upiId: bank.upiId,
      };
    }

    const refund = await Refund.create({
      returnRequestId,
      userId: returnRequest.userId,
      refundMode,
      refundAmount,
      bankDetails,
    });

    res.status(201).json({
      success: true,
      message: "Refund request created",
      data: refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find()
      .populate("returnRequestId")
      .populate("orderId")
      .sort({ createdAt: -1 });

    const formattedRefunds = refunds.map((refund) => ({
      refundId: refund._id,

      returnId: refund.returnRequestId?.returnId || null,

      refundMode: refund.refundMode,

      refundAmount: refund.refundAmount,

      refundStatus: refund.refundStatus,

      refundedAt: refund.refundedAt,

      orderId: refund.orderId?.orderId || null,

      product: refund.orderId?.items?.[0] || {},
    }));

    return res.json({
      success: true,
      count: formattedRefunds.length,
      refunds: formattedRefunds,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.refundSummary = async (
  req,
  res
) => {
  try {
    const [
      pending,
      processing,
      completed,
      failed,
      totalAmount,
    ] = await Promise.all([
      Refund.countDocuments({
        refundStatus: "pending",
      }),

      Refund.countDocuments({
        refundStatus: "processing",
      }),

      Refund.countDocuments({
        refundStatus: "completed",
      }),

      Refund.countDocuments({
        refundStatus: "failed",
      }),

      Refund.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$refundAmount",
            },
          },
        },
      ]),
    ]);

    res.json({
      success: true,

      pendingRefunds: pending,

      processingRefunds:
        processing,

      completedRefunds:
        completed,

      failedRefunds: failed,

      totalRefundAmount:
        totalAmount[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getRefundProcessingData =
  async (req, res) => {
    try {
      const refund =
        await Refund.findById(
          req.params.id
        )
          .populate(
            "returnRequestId"
          )
          .populate(
            "userId",
            "firstName lastName email"
          );

      if (!refund) {
        return res.status(404).json({
          success: false,
          message:
            "Refund not found",
        });
      }

      const order =
        await UserOrder.findById(
          refund.returnRequestId
            .orderId
        );

      res.json({
        success: true,

        refundId: refund._id,

        refundMode:
          refund.refundMode,

        refundAmount:
          refund.refundAmount,

        refundStatus:
          refund.refundStatus,

        transactionId:
          refund.transactionId,

        refundedAt:
          refund.refundedAt,

        customer:
          refund.userId,

        returnRequest:
          refund.returnRequestId,

        product:
          order?.items?.[0] || {},

        orderSummary: {
          orderId:
            order?.orderId,

          orderDate:
            order?.createdAt,

          totalAmount:
            order?.totalAmount,

          paymentMode:
            order?.paymentMode,

          orderStatus:
            order?.orderStatus,
        },

        bankDetails:
          refund.bankDetails,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message,
      });
    }
  };
 
/* ================= PROCESS REFUND ================= */
exports.processRefund = async (req, res) => {
  try {
    const { refundStatus } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "completed",
      "failed",
    ];

    if (
      refundStatus &&
      !validStatuses.includes(refundStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund status",
      });
    }

    const refund = await Refund.findById(
      req.params.id
    );

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    refund.refundStatus =
      refundStatus || "processing";

    // Refund completed
    if (refundStatus === "completed") {
      refund.refundedAt = new Date();

      // Auto generate transaction id
      refund.transactionId = `REF-${Date.now()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;
    }

    // Refund failed
    if (refundStatus === "failed") {
      refund.refundedAt = null;
      refund.transactionId = null;
    }

    await refund.save();

    return res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: refund,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


exports.getRefundOptions = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findById(
      req.params.returnId
    );

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    const order = await UserOrder.findById(
      returnRequest.orderId
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Find returned item
    const returnedItem = order.items.find(
      (item) =>
        item._id.toString() ===
        returnRequest.itemId.toString()
    );

    if (!returnedItem) {
      return res.status(404).json({
        success: false,
        message: "Returned item not found",
      });
    }

    const refundAmount =
      returnedItem.itemTotal ||
      returnedItem.price * returnedItem.quantity;

    // Get user's saved bank accounts
   const bankAccounts = await UserBank.find({
  user: returnRequest.userId,
}).select(
  "_id accountHolderName bankName accountNumber ifscCode upiId"
);

const upiAccounts = bankAccounts.filter(
  (bank) => bank.upiId
);

const refundOptions = [
  {
    code: "STACKLY_BALANCE",
    title: "Stackly Balance",
    description: "Instant refund to Stackly Balance",
  },
];

if (bankAccounts.length > 0) {
  refundOptions.push({
    code: "BANK_ACCOUNT",
    title: "Bank Account",
    description: "Refund to your saved bank account",
    accounts: bankAccounts.map((bank) => ({
      bankAccountId: bank._id,
      accountHolderName: bank.accountHolderName,
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      ifscCode: bank.ifscCode,
    })),
  });
}

if (upiAccounts.length > 0) {
  refundOptions.push({
    code: "UPI",
    title: "UPI",
    description: "Refund directly to your UPI ID",
    accounts: upiAccounts.map((bank) => ({
      bankAccountId: bank._id,
      accountHolderName: bank.accountHolderName,
      upiId: bank.upiId,
    })),
  });
}

return res.status(200).json({
  success: true,
  data: {
    refundAmount,

    item: {
      itemId: returnedItem._id,
      name: returnedItem.name,
      image: returnedItem.image,
      quantity: returnedItem.quantity,
      price: returnedItem.price,
    },

    refundOptions,
  },
});
  } catch (error) {
    console.error("Get Refund Options Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.selectRefundMode = async (req, res) => {
  try {
    const {
      returnRequestId,
      refundMode,
      bankAccountId,
    } = req.body;

    const returnRequest =
      await ReturnRequest.findById(returnRequestId);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    let bankDetails = null;

    if (refundMode === "BANK_ACCOUNT") {
      const bank = await UserBank.findOne({
        _id: bankAccountId,
        user: returnRequest.userId,
      });

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Bank account not found",
        });
      }

      bankDetails = {
        accountHolderName: bank.accountHolderName,
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        ifscCode: bank.ifscCode,
        state: bank.state,
        upiId: bank.upiId,
      };
    }

    const order = await UserOrder.findById(
      returnRequest.orderId
    );

    const returnedItem = order.items.find(
      (item) =>
        item._id.toString() ===
        returnRequest.itemId.toString()
    );

    const refundAmount =
      returnedItem.itemTotal ||
      returnedItem.price * returnedItem.quantity;

    const refund = await Refund.findOneAndUpdate(
      { returnRequestId },
      {
        userId: returnRequest.userId,
        refundMode,
        bankDetails,
        refundAmount,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Refund mode selected successfully",
      data: refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getUserBankAccounts = async (req, res) => {
  try {
    const banks = await UserBank.find({
      user: req.user._id,
      isActive: true,
    });

    res.json({
      success: true,
      data: banks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getRefundDetails = async (
  req,
  res
) => {
  try {
    const refund =
      await Refund.findOne({
        returnRequestId:
          req.params.returnId,
      });

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    res.json({
      success: true,
      data: refund,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};