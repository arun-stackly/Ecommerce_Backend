const ReturnRequest = require("../models/Return");
const UserOrder = require("../models/UserOrder");
const Refund = require("../models/Refund");

/* =========================================
   CREATE RETURN / EXCHANGE REQUEST
========================================= */
exports.createReturnRequest = async (req, res) => {
  try {
    const {
      orderId,
      itemId,
      type,
      reasonCode,
      reasonText,
      comment,
      images,
    } = req.body;

    // =========================
    // Validate Required Fields
    // =========================

    if (
      !orderId ||
      !itemId ||
      !type ||
      !reasonCode ||
      !reasonText
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // =========================
    // Find Order
    // =========================

    const order = await UserOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =========================
    // Customer Id From Order
    // =========================

    const userId = order.customerId;

    // =========================
    // Find Item Inside Order
    // =========================

    const item = order.items.find(
      (item) => item._id.toString() === itemId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

    // =========================
    // Prevent Duplicate Return
    // =========================

    const existingReturn = await ReturnRequest.findOne({
      orderId,
      itemId,
    });

    if (existingReturn) {
      return res.status(400).json({
        success: false,
        message: "Return request already exists for this item",
      });
    }

    // =========================
    // Create Return Request
    // =========================

    const returnRequest = await ReturnRequest.create({
      orderId,
      itemId,
      userId,
      sellerId: item.sellerId,
      type,
      reasonCode,
      reasonText,
      pickupAddress: {
    fullName: order.shippingAddress.fullName,
    phoneNumber: order.shippingAddress.phoneNumber,
    houseNo: order.shippingAddress.houseNo,
    addressLine: order.shippingAddress.addressLine,
    city: order.shippingAddress.city,
    state: order.shippingAddress.state,
    pincode: order.shippingAddress.pincode,
  },
      comment: comment || "",
      images: images || [],
      status: "requested",
    });

    return res.status(201).json({
      success: true,
      message: "Return request created successfully",
      data: returnRequest,
    });

  } catch (error) {
    console.error("Create Return Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET USER RETURN REQUESTS
========================================= */
exports.getMyReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    const formattedReturns = returns.map((item) => ({
      returnRequestId: item._id,   // ✅ MongoDB ObjectId
      returnId: item.returnId,     // ✅ Custom Return ID

      pickupAddress: item.pickupAddress,
      orderId: item.orderId,
      itemId: item.itemId,
      userId: item.userId,
      sellerId: item.sellerId,
      type: item.type,
      reasonCode: item.reasonCode,
      reasonText: item.reasonText,
      comment: item.comment,
      images: item.images,
      status: item.status,
      refundAmount: item.refundAmount,
      isRefunded: item.isRefunded,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.status(200).json({
      success: true,
      returnCount: formattedReturns.length,
      data: formattedReturns,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
exports.getSellerReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({
      sellerId: req.user._id
    });

    res.json({
      success: true,
      data: returns
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

/* =========================================
   GET SINGLE RETURN DETAILS
========================================= */
exports.getSingleReturn = async (req, res) => {
  try {
    const returnReq = await ReturnRequest.findById(req.params.id)
      .populate("userId", "firstName lastName email")
      .populate({
        path: "orderId",
        select: "orderId orderStatus createdAt items",
      });

    if (!returnReq) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    // 🔥 KEEP ONLY RETURNED ITEM
    const returnedItem = returnReq.orderId.items.find(
      (item) =>
        item._id.toString() === returnReq.itemId.toString()
    );
const totalAmount = returnedItem
  ? returnedItem.itemTotal ||
    returnedItem.price * returnedItem.quantity
  : 0;
    return res.json({
      success: true,
      data: {
        returnRequestId: returnReq._id, // ✅ Add this
        returnId: returnReq.returnId,
        status: returnReq.status,
        reasonCode: returnReq.reasonCode,
        reasonText: returnReq.reasonText,
         totalAmount, // amount paid for this item

        refundAmount: returnReq.refundAmount,
        isRefunded: returnReq.isRefunded,
        createdAt: returnReq.createdAt,

        user: returnReq.userId,

        order: {
          orderId: returnReq.orderId.orderId,
          orderStatus: returnReq.orderId.orderStatus,
        },

        // ✅ ONLY RETURNED ITEM (NOT ALL ITEMS)
        item: returnedItem || null,
      },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================================
   UPDATE RETURN STATUS (ADMIN / SELLER)
========================================= */
exports.updateReturnStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected", "pickup_scheduled", "picked", "refunded", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const returnReq = await ReturnRequest.findById(req.params.id);

    if (!returnReq) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    returnReq.status = status;

    if (status === "refunded") {
      returnReq.isRefunded = true;
    }

    if (status === "pickup_scheduled") {
      returnReq.pickupDate = req.body.pickupDate;
    }

    await returnReq.save();

    return res.json({
      success: true,
      message: "Return status updated",
      data: returnReq,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================================
   GET RETURN / EXCHANGE REASONS
========================================= */
exports.getReturnReasons = async (req, res) => {
  try {
    const reasons = [
      {
        code: "NOT_NEEDED",
        title: "Product not needed anymore",
        icon: "👕",
        description: "Didn't like the product or ordered by mistake",
        subReasons: [
          "Found lower price outside",
          "Did not like the product",
          "Delivery was late",
          "Ordered by mistake",
          "Changed my mind"
        ]
      },

      {
        code: "QUALITY_ISSUE",
        title: "Quality issue",
        icon: "🛡️",
        description: "Poor fabric/material, finishing or performance",
        subReasons: [
          "Poor product quality or performance",
         
        ]
      },

      {
        code: "SIZE_ISSUE",
        title: "Size/Fit issue",
        icon: "📏",
        description: "Tight or loose fitting",
        subReasons: [
          "Ordered by mistake",
          "Changed my mind"
        ]
      },

      {
        code: "DAMAGED",
        title: "Damaged / Used product",
        icon: "🎁",
        description: "Dirty, old, torn, broken or used product",
        subReasons: [
            "Dirt/old/used product",
            "Broken or Torn product",
            "Both packageing and product damaged"
        ]
      },

      {
        code: "MISSING_ITEM",
        title: "Item Missing in package",
        icon: "📦",
        description: "Part missing in product or received less quantity",
        subReasons: [
         "Did not receive the product",
        "Received incompleted product"
        ]
      },

      {
        code: "WRONG_ITEM",
        title: "Different product delivered",
        icon: "🔄",
        description: "Received different size/color/product",
        subReasons: [
          "same product but diffreent size",
          "same product but diffrenet colour", 
          "completely diffrenet product"
         
        ]
      },

      
    ];

    return res.status(200).json({
      success: true,
      count: reasons.length,
      data: reasons
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
/* =========================================
   UPDATE RETURN REASON
========================================= */
exports.updateReturnReason = async (req, res) => {
  try {
    const {
      reasonCode,
      reasonText,
      type,
      comment,
      images
    } = req.body;

    const returnRequest =
      await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found"
      });
    }

    // Only owner can edit
    if (
      returnRequest.userId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Allow edit only before seller action
    if (returnRequest.status !== "requested") {
      return res.status(400).json({
        success: false,
        message:
          "Return reason cannot be edited after processing"
      });
    }

    if (reasonCode)
      returnRequest.reasonCode = reasonCode;

    if (reasonText)
      returnRequest.reasonText = reasonText;

    if (type)
      returnRequest.type = type;

    if (comment)
      returnRequest.comment = comment;

    if (images)
      returnRequest.images = images;

    await returnRequest.save();

    return res.json({
      success: true,
      message: "Return reason updated successfully",
      data: returnRequest
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.getReturnTracking = async (req, res) => {
  try {
    const returnRequest =
      await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return not found"
      });
    }

    const refund = await Refund.findOne({
      returnRequestId: returnRequest._id
    });

    const order = await UserOrder.findById(
      returnRequest.orderId
    );

    const product = order.items.find(
      item =>
        item._id.toString() ===
        returnRequest.itemId.toString()
    );

    const requestDate =
      returnRequest.createdAt;

    const pickupDate = new Date(
      requestDate.getTime() +
      1 * 24 * 60 * 60 * 1000
    );

    const refundDate = new Date(
      requestDate.getTime() +
      2 * 24 * 60 * 60 * 1000
    );

    return res.json({
      success: true,

      returnId:
        returnRequest.returnId,

      product,

      totalRefund:
        refund?.refundAmount || 0,

      refundMode:
        refund?.refundMode || null,

      bankDetails:
        refund?.bankDetails || null,

      timeline: [
        {
          title: "Return Requested",
          date: requestDate,
          completed: true
        },

        {
          title: "Item Pickup",
          date: pickupDate,
          completed:
            returnRequest.status !==
            "requested"
        },

        {
          title: "Refund Success",
          date: refundDate,
          completed:
            refund?.refundStatus ===
            "completed"
        }
      ],

      notes: [
        "Keep item in unused condition",
        "Agent will check item before pickup"
      ]
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};