const ReturnRequest = require("../models/Return");
const UserOrder = require("../models/UserOrder");
const Refund = require("../models/Refund");
const {
  uploadToS3,
  getS3SignedUrl,
} = require("../utils/s3Helper");;

exports.createReturnRequest = async (req, res) => {
  try {
    const {
      orderId,
      itemId,
      type,
      reasonCode,
      reasonText,
      comment,
    } = req.body;

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

    const order = await UserOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const userId = order.customerId;

    const item = order.items.find(
      (item) => item._id.toString() === itemId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Order item not found",
      });
    }

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

    /* =========================
       UPLOAD RETURN IMAGES TO S3
    ========================= */

    const uploadedImages = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {

        const extension = file.originalname.includes(".")
          ? file.originalname.split(".").pop().toLowerCase()
          : "";

        const uniqueFileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}` +
          `${extension ? "." + extension : ""}`;

        const key =
          `returns/${req.user._id}/${uniqueFileName}`;

        await uploadToS3(file, key);

        uploadedImages.push(key);
      }
    }

    /* =========================
       CREATE RETURN REQUEST
    ========================= */

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

      // Store S3 KEYS only
      images: uploadedImages,

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

    const formattedReturns = await Promise.all(
      returns.map(async (item) => {

        const data = item.toObject();

        data.images = await Promise.all(
          (data.images || []).map(async (imageKey) => {
            if (!imageKey) return "";

            try {
              return await getS3SignedUrl(imageKey);
            } catch (error) {
              console.error(
                "Return image S3 error:",
                error.message
              );

              return "";
            }
          })
        );

        return data;
      })
    );

    return res.status(200).json({
      success: true,
      returnCount: formattedReturns.length,
      data: formattedReturns,
    });

  } catch (error) {
    console.error("Get My Returns Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================
   GET SELLER RETURNS
========================= */

exports.getSellerReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({
      sellerId: req.user._id,
    }).lean();

    const formattedReturns = await Promise.all(
      returns.map(async (returnReq) => {

        returnReq.images = await Promise.all(
          (returnReq.images || []).map(async (imageKey) => {

            if (!imageKey) return "";

            try {
              return await getS3SignedUrl(imageKey);
            } catch (error) {
              console.error(
                "Seller Return Image S3 Error:",
                error.message
              );

              return "";
            }
          })
        );

        return returnReq;
      })
    );

    return res.status(200).json({
      success: true,
      data: formattedReturns,
    });

  } catch (error) {
    console.error("Get Seller Returns Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET SINGLE RETURN DETAILS
========================================= */

exports.getSingleReturn = async (req, res) => {
  try {
    const returnReq = await ReturnRequest.findById(
      req.params.id
    )
      .populate(
        "userId",
        "firstName lastName email"
      )
      .populate({
        path: "orderId",
        select:
          "orderId orderStatus createdAt items",
      })
      .lean();

    if (!returnReq) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    if (!returnReq.orderId) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    /* =========================
       FIND RETURNED ITEM
    ========================= */

    const returnedItem =
      returnReq.orderId.items.find(
        (item) =>
          item._id.toString() ===
          returnReq.itemId.toString()
      );

    /* =========================
       TOTAL ITEM AMOUNT
    ========================= */

    const totalAmount = returnedItem
      ? Number(
          returnedItem.itemTotal ||
            returnedItem.price *
              returnedItem.quantity
        )
      : 0;

    /* =========================
       S3 PRODUCT IMAGE
    ========================= */

    let formattedItem = returnedItem || null;

    if (formattedItem && formattedItem.image) {
      try {
        formattedItem.image =
          await getS3SignedUrl(
            formattedItem.image
          );
      } catch (error) {
        console.error(
          "Return product image S3 error:",
          error.message
        );

        formattedItem.image = null;
      }
    }
const returnImages = await Promise.all(
  (returnReq.images || []).map(async (imageKey) => {

    if (!imageKey) return "";

    try {
      return await getS3SignedUrl(imageKey);
    } catch (error) {
      console.error(
        "Return evidence image S3 error:",
        error.message
      );

      return "";
    }
  })
);
    /* =========================
       RESPONSE
    ========================= */

    return res.json({
  success: true,

  data: {
    returnRequestId: returnReq._id,
    returnId: returnReq.returnId,

    status: returnReq.status,

    reasonCode: returnReq.reasonCode,
    reasonText: returnReq.reasonText,

    images: returnImages,

    totalAmount,
    refundAmount: returnReq.refundAmount,
    isRefunded: returnReq.isRefunded,

    createdAt: returnReq.createdAt,

    user: returnReq.userId,

    order: {
      orderId: returnReq.orderId.orderId,
      orderStatus: returnReq.orderId.orderStatus,
    },

    item: formattedItem,
  },
});
  } catch (error) {
    console.error(
      "Get Single Return Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================
   UPDATE RETURN STATUS
   ADMIN / SELLER
========================================= */

exports.updateReturnStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "approved",
      "rejected",
      "pickup_scheduled",
      "picked",
      "refunded",
      "completed",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const returnReq =
      await ReturnRequest.findById(
        req.params.id
      );

    if (!returnReq) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    returnReq.status = status;

    /* =========================
       REFUNDED
    ========================= */

    if (status === "refunded") {
      returnReq.isRefunded = true;
    }

    /* =========================
       PICKUP SCHEDULED
    ========================= */

    if (status === "pickup_scheduled") {
      returnReq.pickupDate =
        req.body.pickupDate;
    }

    await returnReq.save();

    return res.json({
      success: true,
      message: "Return status updated",
      data: returnReq,
    });
  } catch (error) {
    console.error(
      "Update Return Status Error:",
      error
    );

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
    } = req.body;

    const returnRequest =
      await ReturnRequest.findById(req.params.id);

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        message: "Return request not found",
      });
    }

    /* =========================
       OWNER CHECK
    ========================= */

    if (
      returnRequest.userId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    /* =========================
       STATUS CHECK
    ========================= */

    if (returnRequest.status !== "requested") {
      return res.status(400).json({
        success: false,
        message:
          "Return reason cannot be edited after processing",
      });
    }

    /* =========================
       UPDATE TEXT FIELDS
    ========================= */

    if (reasonCode) {
      returnRequest.reasonCode = reasonCode;
    }

    if (reasonText) {
      returnRequest.reasonText = reasonText;
    }

    if (type) {
      returnRequest.type = type;
    }

    if (comment) {
      returnRequest.comment = comment;
    }

    /* =========================
       UPLOAD NEW IMAGES
    ========================= */

    if (req.files && req.files.length > 0) {

      const uploadedImages = [];

      for (const file of req.files) {

        const extension = file.originalname.includes(".")
          ? file.originalname.split(".").pop().toLowerCase()
          : "";

        const uniqueFileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}` +
          `${extension ? "." + extension : ""}`;

        const key =
          `returns/${req.user._id}/${uniqueFileName}`;

        await uploadToS3(file, key);

        uploadedImages.push(key);
      }

      /*
       * Replace old image list
       */
      returnRequest.images = uploadedImages;
    }

    await returnRequest.save();

    return res.json({
      success: true,
      message: "Return reason updated successfully",
      data: returnRequest,
    });

  } catch (error) {
    console.error("Update Return Reason Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getReturnTracking = async (req, res) => {
  try {
    const returnRequest = await ReturnRequest.findById(req.params.id);

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

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const product = order.items.find(
      item =>
        item._id.toString() ===
        returnRequest.itemId.toString()
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found in order"
      });
    }

    /* =========================
       S3 PRODUCT IMAGE
    ========================= */

    if (product.image) {
      try {
        product.image = await getS3SignedUrl(product.image);
      } catch (s3Error) {
        console.error(
          "Return Tracking S3 Image Error:",
          s3Error.message
        );

        product.image = "";
      }
    }

    const requestDate = returnRequest.createdAt;

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

      returnId: returnRequest.returnId,

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
            returnRequest.status !== "requested"
        },

        {
          title: "Refund Success",
          date: refundDate,
          completed:
            refund?.refundStatus === "completed"
        }
      ],

      notes: [
        "Keep item in unused condition",
        "Agent will check item before pickup"
      ]
    });

  } catch (error) {
    console.error(
      "Get Return Tracking Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};