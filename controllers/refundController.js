const Refund = require("../models/Refund");
const ReturnRequest = require("../models/Return");
const UserOrder = require("../models/UserOrder");
 
exports.createRefund = async (req, res) => {
  try {
    const {
      returnRequestId,
      refundMode,
      bankDetails,
    } = req.body;

    const returnRequest =
      await ReturnRequest.findById(
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
  Number(returnedItem.price) *
  Number(returnedItem.quantity);

const refund = await Refund.create({
  returnRequestId,
  userId: returnRequest.userId,
  refundMode,
  refundAmount,
  bankDetails:
    refundMode === "BANK_ACCOUNT"
      ? bankDetails
      : {},
});

    res.status(201).json({
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
exports.getRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find()
      .populate({
        path: "returnRequestId",
      })
      .sort({ createdAt: -1 });

    const formattedRefunds = await Promise.all(
      refunds.map(async (refund) => {
        const order = await UserOrder.findById(
          refund.returnRequestId.orderId
        );

        return {
          refundId: refund._id,

          returnId:
            refund.returnRequestId.returnId,

          refundMode: refund.refundMode,

          refundAmount:
            refund.refundAmount,

          refundStatus:
            refund.refundStatus,

          refundedAt:
            refund.refundedAt,

          orderId: order?.orderId,

          product:
            order?.items?.[0] || {},
        };
      })
    );

    res.json({
      success: true,
      count: formattedRefunds.length,
      refunds: formattedRefunds,
    });
  } catch (error) {
    res.status(500).json({
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
        message: "Returned item not found in order",
      });
    }

    const refundAmount =
      returnedItem.price * returnedItem.quantity;

    return res.json({
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

        options: [
          {
            code: "STACKLY_BALANCE",
            title: "Stackly Balance",
            description: "Instant refund to wallet",
          },
          {
            code: "BANK_ACCOUNT",
            title: "Bank Account",
            description:
              "Refund to original bank account",
          },
        ],
      },
    });
  } catch (error) {
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
      bankDetails,
    } = req.body;

    const returnRequest =
      await ReturnRequest.findById(
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
  returnedItem.price * returnedItem.quantity;

const refund = await Refund.findOneAndUpdate(
  {
    returnRequestId,
  },
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
    res.json({
      success: true,
      message:
        "Refund mode selected successfully",
      data: refund,
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