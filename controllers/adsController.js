const mongoose = require("mongoose");

const Ad = require("../models/Ad");
const SellerInventory = require("../models/SellerInventory");

/* =====================================================
   GET PRODUCTS FOR AD

   GET /api/ads/products
===================================================== */

exports.getProductsForAd = async (req, res) => {
  try {
    const {
      category,
      subcategory,
      subSubcategory,
      productType,
    } = req.query;

    console.log("Ad Product Query:", req.query);

    const filter = {
      seller: req.user._id,
      isActive: true,
    };

    /* =========================================
       CATEGORY
    ========================================= */

    if (
      category &&
      mongoose.Types.ObjectId.isValid(category)
    ) {
      filter.category =
        new mongoose.Types.ObjectId(category);
    }

    /* =========================================
       SUBCATEGORY
    ========================================= */

    if (
      subcategory &&
      mongoose.Types.ObjectId.isValid(subcategory)
    ) {
      filter.subcategory =
        new mongoose.Types.ObjectId(subcategory);
    }

    /* =========================================
       SUB SUBCATEGORY
    ========================================= */

    if (
      subSubcategory &&
      mongoose.Types.ObjectId.isValid(subSubcategory)
    ) {
      filter.subSubcategory =
        new mongoose.Types.ObjectId(
          subSubcategory
        );
    }

    /* =========================================
       PRODUCT TYPE
    ========================================= */

    if (
      productType &&
      mongoose.Types.ObjectId.isValid(productType)
    ) {
      filter.productType =
        new mongoose.Types.ObjectId(productType);
    }

    const products =
      await SellerInventory.find(filter)
        .populate("productType", "name")
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate("subSubcategory", "name")
        .select(
          "_id name productType category subcategory subSubcategory media"
        );

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message:
          "No products found for the logged-in seller with the selected filters.",
      });
    }

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });

  } catch (error) {
    console.error(
      "Get Products For Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   CREATE ADVERTISEMENT

   POST /api/ads

   IMPORTANT:
   New ads always start as pending.
===================================================== */

exports.createAd = async (req, res) => {
  try {
    const {
      product,
      category,
      subcategory,
      subSubcategory,
      productType,
      description,
      mediaUrl,
      adType,
      requestedBudget,
    } = req.body;

    /* =========================================
       REQUIRED FIELDS
    ========================================= */

    if (
      !product ||
      !category ||
      !mediaUrl ||
      !adType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "product, category, mediaUrl and adType are required",
      });
    }

    /* =========================================
       VALIDATE BUDGET
    ========================================= */

    if (
      requestedBudget === undefined ||
      requestedBudget === null ||
      Number(requestedBudget) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid requestedBudget is required",
      });
    }

    /* =========================================
       VALIDATE PRODUCT

       Product must belong to logged-in seller
    ========================================= */

    const inventory =
      await SellerInventory.findOne({
        _id: product,
        seller: req.user._id,
        isActive: true,
      });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found or does not belong to seller",
      });
    }

    /* =========================================
       VALIDATE CATEGORY
    ========================================= */

    if (
      inventory.category?.toString() !==
      category.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected product does not match category",
      });
    }

    /* =========================================
       VALIDATE SUBCATEGORY

       Only validate if product has one
    ========================================= */

    if (
      inventory.subcategory &&
      inventory.subcategory.toString() !==
        (subcategory || "").toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected product does not match subcategory",
      });
    }

    /* =========================================
       VALIDATE SUB SUBCATEGORY
    ========================================= */

    if (
      inventory.subSubcategory &&
      inventory.subSubcategory.toString() !==
        (subSubcategory || "").toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected product does not match subSubcategory",
      });
    }

    /* =========================================
       VALIDATE PRODUCT TYPE
    ========================================= */

    if (
      inventory.productType &&
      inventory.productType.toString() !==
        (productType || "").toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Selected product does not match productType",
      });
    }

    /* =========================================
       CREATE AD

       ADMIN-ONLY FIELDS ARE CONTROLLED HERE
    ========================================= */

    const ad = await Ad.create({
      seller: req.user._id,

      product: inventory._id,

      category: inventory.category,

      subcategory:
        inventory.subcategory || null,

      subSubcategory:
        inventory.subSubcategory || null,

      productType:
        inventory.productType || null,

      mediaUrl,

      description:
        description || "",

      adType,

      requestedBudget:
        Number(requestedBudget),

      // =====================================
      // ADMIN WORKFLOW
      // =====================================

      status: "pending",

      requestedAt: new Date(),

      approvedAt: null,

      rejectedAt: null,

      rejectionReason: "",

      // New ad cannot be active before approval
      isActive: false,
    });

    return res.status(201).json({
      success: true,
      message:
        "Advertisement submitted successfully and is waiting for admin approval",

      ad,
    });

  } catch (error) {
    console.error(
      "Create Advertisement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   BULK CREATE ADS

   POST /api/ads/bulk
===================================================== */

exports.createMultipleAds = async (req, res) => {
  try {
    const { ads } = req.body;

    if (
      !Array.isArray(ads) ||
      !ads.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Ads data is required",
      });
    }

    const createdAds = [];

    /* =========================================
       PROCESS EACH AD

       We validate product ownership instead
       of blindly using insertMany().
    ========================================= */

    for (const adData of ads) {
      const {
        product,
        category,
        subcategory,
        subSubcategory,
        productType,
        description,
        mediaUrl,
        adType,
        requestedBudget,
      } = adData;

      if (
        !product ||
        !category ||
        !mediaUrl ||
        !adType ||
        requestedBudget === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each ad requires product, category, mediaUrl, adType and requestedBudget",
        });
      }

      /* =====================================
         VERIFY PRODUCT
      ===================================== */

      const inventory =
        await SellerInventory.findOne({
          _id: product,
          seller: req.user._id,
          isActive: true,
        });

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message:
            `Product ${product} not found or does not belong to seller`,
        });
      }

      /* =====================================
         CREATE AD
      ===================================== */

      const newAd = await Ad.create({
        seller: req.user._id,

        product: inventory._id,

        category: inventory.category,

        subcategory:
          inventory.subcategory || null,

        subSubcategory:
          inventory.subSubcategory || null,

        productType:
          inventory.productType || null,

        mediaUrl,

        description:
          description || "",

        adType,

        requestedBudget:
          Number(requestedBudget),

        // ADMIN WORKFLOW
        status: "pending",

        requestedAt: new Date(),

        approvedAt: null,

        rejectedAt: null,

        rejectionReason: "",

        isActive: false,
      });

      createdAds.push(newAd);
    }

    return res.status(201).json({
      success: true,

      message:
        "Advertisements submitted successfully and are waiting for admin approval",

      count: createdAds.length,

      ads: createdAds,
    });

  } catch (error) {
    console.error(
      "Bulk Create Ads Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   GET SELLER ADS

   GET /api/ads

   Optional:

   ?status=pending
   ?status=approved
   ?status=rejected
   ?status=all
===================================================== */

exports.getSellerAds = async (req, res) => {
  try {
    const {
      status = "all",
    } = req.query;

    const filter = {
      seller: req.user._id,
    };

    /* =========================================
       STATUS FILTER
    ========================================= */

    if (
      ["pending", "approved", "rejected"].includes(
        status
      )
    ) {
      filter.status = status;
    }

    const ads =
      await Ad.find(filter)
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate("subSubcategory", "name")
        .populate("productType", "name")
        .populate(
          "product",
          "name price media"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      count: ads.length,

      ads,
    });

  } catch (error) {
    console.error(
      "Get Seller Ads Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   GET AD BY ID

   GET /api/ads/:id
===================================================== */

exports.getAdById = async (req, res) => {
  try {
    const ad =
      await Ad.findOne({
        _id: req.params.id,
        seller: req.user._id,
      })
        .populate("category", "name")
        .populate("subcategory", "name")
        .populate("subSubcategory", "name")
        .populate("productType", "name")
        .populate(
          "product",
          "name price media"
        );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    return res.status(200).json({
      success: true,
      ad,
    });

  } catch (error) {
    console.error(
      "Get Ad By ID Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   UPDATE AD

   PATCH /api/ads/:id

   Seller can update ad details.

   Seller CANNOT modify:
   - status
   - approvedAt
   - rejectedAt
   - rejectionReason
   - isActive
   - seller
===================================================== */

exports.updateAd = async (req, res) => {
  try {
    const ad =
      await Ad.findOne({
        _id: req.params.id,
        seller: req.user._id,
      });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    /* =========================================
       PREVENT ADMIN FIELD MANIPULATION
    ========================================= */

    const allowedFields = [
      "product",
      "category",
      "subcategory",
      "subSubcategory",
      "productType",
      "description",
      "mediaUrl",
      "adType",
      "requestedBudget",
    ];

    for (const field of allowedFields) {
      if (
        req.body[field] !== undefined
      ) {
        ad[field] =
          req.body[field];
      }
    }

    /* =========================================
       IMPORTANT

       If seller edits an already rejected ad,
       send it back for admin approval.
    ========================================= */

    if (
      ad.status === "rejected"
    ) {
      ad.status = "pending";

      ad.requestedAt = new Date();

      ad.rejectedAt = null;

      ad.rejectionReason = "";

      ad.approvedAt = null;

      ad.isActive = false;
    }

    /* =========================================
       If approved ad is edited,
       require admin approval again.
    ========================================= */

    else if (
      ad.status === "approved"
    ) {
      ad.status = "pending";

      ad.requestedAt = new Date();

      ad.approvedAt = null;

      ad.isActive = false;
    }

    await ad.save();

    return res.status(200).json({
      success: true,

      message:
        "Advertisement updated and submitted for admin approval",

      ad,
    });

  } catch (error) {
    console.error(
      "Update Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   PAUSE AD

   PATCH /api/ads/:id/pause
===================================================== */

exports.pauseAd = async (req, res) => {
  try {
    const ad =
      await Ad.findOne({
        _id: req.params.id,
        seller: req.user._id,
      });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    /* =========================================
       ONLY APPROVED ADS CAN BE PAUSED
    ========================================= */

    if (
      ad.status !== "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved advertisements can be paused",
      });
    }

    ad.isActive = false;

    await ad.save();

    return res.status(200).json({
      success: true,

      message:
        "Advertisement paused successfully",

      ad,
    });

  } catch (error) {
    console.error(
      "Pause Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   RESUME AD

   PATCH /api/ads/:id/resume
===================================================== */

exports.resumeAd = async (req, res) => {
  try {
    const ad =
      await Ad.findOne({
        _id: req.params.id,
        seller: req.user._id,
      });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    /* =========================================
       ONLY APPROVED ADS CAN BE RESUMED
    ========================================= */

    if (
      ad.status !== "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Advertisement must be approved by admin before it can be resumed",
      });
    }

    ad.isActive = true;

    await ad.save();

    return res.status(200).json({
      success: true,

      message:
        "Advertisement resumed successfully",

      ad,
    });

  } catch (error) {
    console.error(
      "Resume Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   DELETE AD

   DELETE /api/ads/:id
===================================================== */

exports.deleteAd = async (req, res) => {
  try {
    const ad =
      await Ad.findOneAndDelete({
        _id: req.params.id,
        seller: req.user._id,
      });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Advertisement deleted successfully",
    });

  } catch (error) {
    console.error(
      "Delete Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   GET ACTIVE ADS

   GET /api/ads/active

   Only:
   status = approved
   isActive = true
===================================================== */

exports.getActiveAds = async (req, res) => {
  try {
    const ads =
      await Ad.find({
        status: "approved",
        isActive: true,
      })
        .populate(
          "category",
          "name"
        )
        .populate(
          "subcategory",
          "name"
        )
        .populate(
          "subSubcategory",
          "name"
        )
        .populate(
          "productType",
          "name"
        )
        .populate(
          "product",
          "name price media"
        )
        .populate(
          "seller",
          "name email"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      count: ads.length,

      ads,
    });

  } catch (error) {
    console.error(
      "Get Active Ads Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
