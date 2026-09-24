const mongoose = require("mongoose");

const Ad = require("../models/Ad");
const SellerInventory = require("../models/SellerInventory");
const AdminSettings = require("../models/AdminSettings");

const {
  uploadToS3,
  getS3SignedUrl,
  deleteFromS3,
} = require("../utils/s3Helper");

/* =========================================================
   GET PRODUCTS FOR AD
   GET /api/ads/products
========================================================= */

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
      isActive: true,
    };

    /* ================= CATEGORY ================= */

    if (
      category &&
      mongoose.Types.ObjectId.isValid(category)
    ) {
      filter.category = category;
    }

    /* ================= SUBCATEGORY ================= */

    if (
      subcategory &&
      mongoose.Types.ObjectId.isValid(subcategory)
    ) {
      filter.subcategory = subcategory;
    }

    /* ================= SUB SUBCATEGORY ================= */

    if (
      subSubcategory &&
      mongoose.Types.ObjectId.isValid(subSubcategory)
    ) {
      filter.subSubcategory = subSubcategory;
    }

    /* ================= PRODUCT TYPE ================= */

    if (
      productType &&
      mongoose.Types.ObjectId.isValid(productType)
    ) {
      filter.productType = productType;
    }

    const products = await SellerInventory.find(filter)
      .populate("productType", "name")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .select(
        "_id name productType category subcategory subSubcategory media seller"
      )
      .lean();

    /* ================= SIGN S3 URLS ================= */

    const productsWithSignedUrls = await Promise.all(
      products.map(async (product) => {
        const productObject = {
          ...product,
        };

        if (
          Array.isArray(productObject.media) &&
          productObject.media.length > 0
        ) {
          productObject.media = await Promise.all(
            productObject.media.map(async (media) => {
              if (!media || !media.url) {
                return media;
              }

              try {
                const signedUrl =
                  await getS3SignedUrl(media.url);

                return {
                  ...media,
                  url: signedUrl,
                };
              } catch (error) {
                console.error(
                  `Failed to generate S3 URL for product ${productObject._id}:`,
                  error.message
                );

                return {
                  ...media,
                  url: null,
                };
              }
            })
          );
        }

        return productObject;
      })
    );

    return res.status(200).json({
      success: true,
      count: productsWithSignedUrls.length,
      data: productsWithSignedUrls,
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


/* =========================================================
   CREATE AD
   POST /api/ads
========================================================= */

exports.createAd = async (req, res) => {
  try {
    const {
      product,
      category,
      subcategory,
      subSubcategory,
      productType,
      description,
      adType,
      requestedBudget,
    } = req.body;

    /* ================= IMAGE VALIDATION ================= */

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Advertisement image is required",
      });
    }

    /* ================= REQUIRED FIELDS ================= */

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    if (!adType) {
      return res.status(400).json({
        success: false,
        message: "Ad type is required",
      });
    }

    /* ================= OBJECT ID VALIDATION ================= */

    if (!mongoose.Types.ObjectId.isValid(product)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (
      subcategory &&
      !mongoose.Types.ObjectId.isValid(subcategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid subcategory ID",
      });
    }

    if (
      subSubcategory &&
      !mongoose.Types.ObjectId.isValid(subSubcategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid subSubcategory ID",
      });
    }

    if (
      productType &&
      !mongoose.Types.ObjectId.isValid(productType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid productType ID",
      });
    }

    /* ================= BUDGET VALIDATION ================= */

    let budget = 0;

    if (
      requestedBudget !== undefined &&
      requestedBudget !== null &&
      requestedBudget !== ""
    ) {
      budget = Number(requestedBudget);

      if (Number.isNaN(budget) || budget < 0) {
        return res.status(400).json({
          success: false,
          message: "Requested budget must be a valid positive number",
        });
      }
    }

    /* ================= CHECK PRODUCT ================= */

    const productData = await SellerInventory.findOne({
      _id: product,
      seller: req.user._id,
      isActive: true,
    });

    if (!productData) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found, inactive, or does not belong to you",
      });
    }

    /* ================= TAXONOMY VALIDATION ================= */

    if (
      productData.category &&
      productData.category.toString() !== category.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Product does not belong to selected category",
      });
    }

    if (
      subcategory &&
      productData.subcategory &&
      productData.subcategory.toString() !==
        subcategory.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product does not belong to selected subcategory",
      });
    }

    if (
      subSubcategory &&
      productData.subSubcategory &&
      productData.subSubcategory.toString() !==
        subSubcategory.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product does not belong to selected subSubcategory",
      });
    }

    if (
      productType &&
      productData.productType &&
      productData.productType.toString() !==
        productType.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product does not belong to selected product type",
      });
    }

    /* ================= ADMIN SETTINGS ================= */

    const settings = await AdminSettings.findOne();

    const autoApprove =
      settings?.autoApproveSellerAds === true;

    const status = autoApprove
      ? "approved"
      : "pending";

    const isActive = autoApprove;

    /* ================= CREATE UNIQUE FILE NAME ================= */

    const extension = req.file.originalname.includes(".")
      ? req.file.originalname
          .split(".")
          .pop()
          .toLowerCase()
      : "";

    const uniqueFileName =
      `${Date.now()}-` +
      `${Math.random()
        .toString(36)
        .substring(2, 10)}` +
      `${extension ? "." + extension : ""}`;

    /* ================= S3 KEY ================= */

    const imageKey =
      `advertisements/${req.user._id}/${uniqueFileName}`;

    /* ================= UPLOAD TO S3 ================= */

    await uploadToS3(
      req.file,
      imageKey
    );

    /* ================= CREATE AD ================= */

    const ad = new Ad({
      seller: req.user._id,
      product,
      category,
      subcategory: subcategory || null,
      subSubcategory: subSubcategory || null,
      productType: productType || null,

      mediaUrl: imageKey,

      description: description || "",
      adType,
      requestedBudget: budget,

      status,
      isActive,

      requestedAt: new Date(),

      approvedAt: autoApprove
        ? new Date()
        : null,

      rejectedAt: null,
      rejectionReason: null,
    });

    await ad.save();

    /* ================= SIGN URL FOR RESPONSE ================= */

    let signedUrl = null;

    try {
      signedUrl = await getS3SignedUrl(
        ad.mediaUrl
      );
    } catch (error) {
      console.error(
        "Failed to generate ad image URL:",
        error.message
      );
    }

    const adObject = ad.toObject();

    adObject.mediaUrl = signedUrl;

    return res.status(201).json({
      success: true,
      message: autoApprove
        ? "Advertisement created and approved successfully"
        : "Advertisement created and sent for approval",
      ad: adObject,
    });
  } catch (error) {
    console.error(
      "Create Ad Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   CREATE MULTIPLE ADS
   POST /api/ads/bulk

   NOTE:
   This API expects mediaUrl as an existing S3 key.
   It does NOT upload files.
========================================================= */

exports.createMultipleAds = async (req, res) => {
  try {
    const { ads } = req.body;

    if (!Array.isArray(ads) || ads.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Ads array is required",
      });
    }

    const settings = await AdminSettings.findOne();

    const autoApprove =
      settings?.autoApproveSellerAds === true;

    const status = autoApprove
      ? "approved"
      : "pending";

    const isActive = autoApprove;

    const adsToCreate = [];

    for (const item of ads) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Product is required for every ad",
        });
      }

      if (!item.category) {
        return res.status(400).json({
          success: false,
          message: "Category is required for every ad",
        });
      }

      if (!item.adType) {
        return res.status(400).json({
          success: false,
          message: "Ad type is required for every ad",
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          item.product
        )
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid product ID: ${item.product}`,
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(
          item.category
        )
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid category ID: ${item.category}`,
        });
      }

      /* ================= CHECK PRODUCT ================= */

      const productData =
        await SellerInventory.findOne({
          _id: item.product,
          seller: req.user._id,
          isActive: true,
        });

      if (!productData) {
        return res.status(404).json({
          success: false,
          message:
            `Product not found or does not belong to you: ${item.product}`,
        });
      }

      /* ================= BUDGET ================= */

      let budget = 0;

      if (
        item.requestedBudget !== undefined &&
        item.requestedBudget !== null &&
        item.requestedBudget !== ""
      ) {
        budget = Number(
          item.requestedBudget
        );

        if (
          Number.isNaN(budget) ||
          budget < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Requested budget must be a valid positive number",
          });
        }
      }

      adsToCreate.push({
        seller: req.user._id,

        product: item.product,
        category: item.category,

        subcategory:
          item.subcategory || null,

        subSubcategory:
          item.subSubcategory || null,

        productType:
          item.productType || null,

        mediaUrl:
          item.mediaUrl || null,

        description:
          item.description || "",

        adType:
          item.adType,

        requestedBudget:
          budget,

        status,
        isActive,

        requestedAt: new Date(),

        approvedAt:
          autoApprove
            ? new Date()
            : null,

        rejectedAt: null,
        rejectionReason: null,
      });
    }

    const createdAds =
      await Ad.insertMany(
        adsToCreate
      );

    /* ================= SIGN IMAGE URLS ================= */

    const adsWithSignedUrls =
      await Promise.all(
        createdAds.map(
          async (ad) => {
            const adObject =
              ad.toObject();

            if (
              adObject.mediaUrl
            ) {
              try {
                adObject.mediaUrl =
                  await getS3SignedUrl(
                    adObject.mediaUrl
                  );
              } catch (error) {
                console.error(
                  "Bulk ad image URL error:",
                  error.message
                );

                adObject.mediaUrl =
                  null;
              }
            }

            return adObject;
          }
        )
      );

    return res.status(201).json({
      success: true,
      message: autoApprove
        ? "Advertisements created and approved successfully"
        : "Advertisements created and sent for approval",
      count: adsWithSignedUrls.length,
      ads: adsWithSignedUrls,
    });
  } catch (error) {
    console.error(
      "Create Multiple Ads Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET SELLER ADS
   GET /api/ads/my-ads
========================================================= */

exports.getSellerAds = async (req, res) => {
  try {
    const {
      status,
    } = req.query;

    const filter = {
      seller: req.user._id,
    };

    /* ================= STATUS FILTER ================= */

    if (
      status &&
      ["pending", "approved", "rejected"].includes(
        status
      )
    ) {
      filter.status = status;
    }

    const ads = await Ad.find(filter)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .populate("productType", "name")
      .populate(
        "product",
        "name price discountPrice media"
      )
      .sort({
        createdAt: -1,
      })
      .lean();

    /* ================= SIGN ALL IMAGE URLS ================= */

    const adsWithSignedUrls =
      await Promise.all(
        ads.map(async (ad) => {
          const adObject = {
            ...ad,
          };

          /* ================= AD IMAGE ================= */

          if (
            adObject.mediaUrl
          ) {
            try {
              adObject.mediaUrl =
                await getS3SignedUrl(
                  adObject.mediaUrl
                );
            } catch (error) {
              console.error(
                `Failed to generate URL for ad ${adObject._id}:`,
                error.message
              );

              adObject.mediaUrl =
                null;
            }
          }

          /* ================= PRODUCT IMAGES ================= */

          if (
            adObject.product &&
            Array.isArray(
              adObject.product.media
            )
          ) {
            adObject.product.media =
              await Promise.all(
                adObject.product.media.map(
                  async (media) => {
                    if (
                      !media ||
                      !media.url
                    ) {
                      return media;
                    }

                    try {
                      return {
                        ...media,
                        url:
                          await getS3SignedUrl(
                            media.url
                          ),
                      };
                    } catch (error) {
                      console.error(
                        "Product image URL error:",
                        error.message
                      );

                      return {
                        ...media,
                        url: null,
                      };
                    }
                  }
                )
              );
          }

          return adObject;
        })
      );

    return res.status(200).json({
      success: true,
      count:
        adsWithSignedUrls.length,
      ads:
        adsWithSignedUrls,
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


/* =========================================================
   GET AD BY ID
   GET /api/ads/:id
========================================================= */

exports.getAdById = async (req, res) => {
  try {
    const {
      id,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid advertisement ID",
      });
    }

    const ad = await Ad.findOne({
      _id: id,
      seller: req.user._id,
    })
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .populate("productType", "name")
      .populate(
        "product",
        "name price discountPrice media"
      );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    const adObject =
      ad.toObject();

    /* ================= AD IMAGE ================= */

    if (
      adObject.mediaUrl
    ) {
      try {
        adObject.mediaUrl =
          await getS3SignedUrl(
            adObject.mediaUrl
          );
      } catch (error) {
        console.error(
          "Ad image URL error:",
          error.message
        );

        adObject.mediaUrl =
          null;
      }
    }

    /* ================= PRODUCT IMAGES ================= */

    if (
      adObject.product &&
      Array.isArray(
        adObject.product.media
      )
    ) {
      adObject.product.media =
        await Promise.all(
          adObject.product.media.map(
            async (media) => {
              if (
                !media ||
                !media.url
              ) {
                return media;
              }

              try {
                return {
                  ...media,
                  url:
                    await getS3SignedUrl(
                      media.url
                    ),
                };
              } catch (error) {
                console.error(
                  "Product image URL error:",
                  error.message
                );

                return {
                  ...media,
                  url: null,
                };
              }
            }
          )
        );
    }

    return res.status(200).json({
      success: true,
      ad: adObject,
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


/* =========================================================
   UPDATE AD
   PUT /api/ads/:id/update

   image is optional.

   If image is uploaded:
   1. Upload new image
   2. Save new S3 key in MongoDB
   3. Delete old image
========================================================= */

exports.updateAd = async (req, res) => {
  let newImageKey = null;

  try {
    const {
      id,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid advertisement ID",
      });
    }

    const ad = await Ad.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    /* ================= ALLOWED FIELDS ================= */

    const allowedFields = [
      "product",
      "category",
      "subcategory",
      "subSubcategory",
      "productType",
      "description",
      "adType",
      "requestedBudget",
    ];

    /* ================= UPDATE BODY FIELDS ================= */

    for (
      const field of allowedFields
    ) {
      if (
        req.body[field] !== undefined
      ) {
        ad[field] =
          req.body[field];
      }
    }

    /* ================= BUDGET VALIDATION ================= */

    if (
      req.body.requestedBudget !==
        undefined
    ) {
      const budget =
        Number(
          req.body.requestedBudget
        );

      if (
        Number.isNaN(budget) ||
        budget < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Requested budget must be a valid positive number",
        });
      }

      ad.requestedBudget =
        budget;
    }

    /* ================= PRODUCT VALIDATION ================= */

    if (
      req.body.product
    ) {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.body.product
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID",
        });
      }

      const productData =
        await SellerInventory.findOne({
          _id:
            req.body.product,
          seller:
            req.user._id,
          isActive: true,
        });

      if (!productData) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found or does not belong to you",
        });
      }
    }

    /* ================= CATEGORY VALIDATION ================= */

    if (
      req.body.category &&
      !mongoose.Types.ObjectId.isValid(
        req.body.category
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid category ID",
      });
    }

    /* ================= SUBCATEGORY ================= */

    if (
      req.body.subcategory &&
      !mongoose.Types.ObjectId.isValid(
        req.body.subcategory
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid subcategory ID",
      });
    }

    /* ================= SUB SUBCATEGORY ================= */

    if (
      req.body.subSubcategory &&
      !mongoose.Types.ObjectId.isValid(
        req.body.subSubcategory
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid subSubcategory ID",
      });
    }

    /* ================= PRODUCT TYPE ================= */

    if (
      req.body.productType &&
      !mongoose.Types.ObjectId.isValid(
        req.body.productType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid productType ID",
      });
    }

    /* ================= AD TYPE ================= */

    if (
      req.body.adType === ""
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Ad type cannot be empty",
      });
    }

    /* ================= STORE OLD IMAGE ================= */

    const oldImageKey =
      ad.mediaUrl;

    /* ================= NEW IMAGE ================= */

    if (req.file) {
      const extension =
        req.file.originalname.includes(
          "."
        )
          ? req.file.originalname
              .split(".")
              .pop()
              .toLowerCase()
          : "";

      const uniqueFileName =
        `${Date.now()}-` +
        `${Math.random()
          .toString(36)
          .substring(2, 10)}` +
        `${
          extension
            ? "." + extension
            : ""
        }`;

      newImageKey =
        `advertisements/${req.user._id}/${uniqueFileName}`;

      /* ================= UPLOAD NEW IMAGE ================= */

      await uploadToS3(
        req.file,
        newImageKey
      );

      ad.mediaUrl =
        newImageKey;
    }

    /* =====================================================
       STATUS RESET

       If rejected advertisement is edited,
       send it back to pending.

       If approved advertisement is edited,
       also send it back to pending.
    ===================================================== */

    if (
      ad.status === "rejected"
    ) {
      ad.status =
        "pending";

      ad.isActive =
        false;

      ad.rejectionReason =
        null;

      ad.rejectedAt =
        null;

      ad.approvedAt =
        null;

      ad.requestedAt =
        new Date();
    } else if (
      ad.status === "approved"
    ) {
      ad.status =
        "pending";

      ad.isActive =
        false;

      ad.approvedAt =
        null;

      ad.requestedAt =
        new Date();
    }

    /* ================= SAVE ================= */

    await ad.save();

    /* ================= DELETE OLD IMAGE ================= */

    if (
      newImageKey &&
      oldImageKey &&
      oldImageKey !== newImageKey
    ) {
      try {
        await deleteFromS3(
          oldImageKey
        );
      } catch (error) {
        console.error(
          "Failed to delete old ad image:",
          error.message
        );
      }
    }

    /* ================= RESPONSE ================= */

    const adObject =
      ad.toObject();

    if (
      adObject.mediaUrl
    ) {
      try {
        adObject.mediaUrl =
          await getS3SignedUrl(
            adObject.mediaUrl
          );
      } catch (error) {
        console.error(
          "Updated ad image URL error:",
          error.message
        );

        adObject.mediaUrl =
          null;
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "Advertisement updated successfully",
      ad: adObject,
    });
  } catch (error) {
    console.error(
      "Update Ad Error:",
      error
    );

    /* ================= CLEAN NEW IMAGE ================= */

    if (newImageKey) {
      try {
        await deleteFromS3(
          newImageKey
        );
      } catch (deleteError) {
        console.error(
          "Failed to clean up new S3 image:",
          deleteError.message
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   PAUSE AD
   PATCH /api/ads/:id/pause
========================================================= */

exports.pauseAd = async (req, res) => {
  try {
    const {
      id,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement ID",
      });
    }

    const ad = await Ad.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    if (
      ad.status !==
      "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved advertisements can be paused",
      });
    }

    ad.isActive =
      false;

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


/* =========================================================
   RESUME AD
   PATCH /api/ads/:id/resume
========================================================= */

exports.resumeAd = async (req, res) => {
  try {
    const {
      id,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement ID",
      });
    }

    const ad = await Ad.findOne({
      _id: id,
      seller: req.user._id,
    });

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    if (
      ad.status !==
      "approved"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only approved advertisements can be resumed",
      });
    }

    ad.isActive =
      true;

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


/* =========================================================
   DELETE AD
   DELETE /api/ads/:id

   ADMIN ONLY

   Deletes:
   1. S3 image
   2. MongoDB ad
========================================================= */

exports.deleteAd = async (req, res) => {
  try {
    const {
      id,
    } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        id
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid advertisement ID",
      });
    }

    const ad =
      await Ad.findById(
        id
      );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message:
          "Advertisement not found",
      });
    }

    /* ================= DELETE S3 IMAGE ================= */

    if (
      ad.mediaUrl
    ) {
      try {
        await deleteFromS3(
          ad.mediaUrl
        );
      } catch (error) {
        console.error(
          "S3 ad image deletion failed:",
          error.message
        );
      }
    }

    /* ================= DELETE MONGODB ================= */

    await Ad.findByIdAndDelete(
      id
    );

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


/* =========================================================
   GET ACTIVE ADS
   GET /api/ads/active

   PUBLIC API
========================================================= */

exports.getActiveAds = async (
  req,
  res
) => {
  try {
    const ads =
      await Ad.find({
        status:
          "approved",

        isActive:
          true,
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
          "name price discountPrice media"
        )
        .populate(
          "seller",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    /* ================= SIGN ALL IMAGES ================= */

    const adsWithImageUrl =
      await Promise.all(
        ads.map(
          async (ad) => {
            const adObject = {
              ...ad,
            };

            /* ================= AD IMAGE ================= */

            if (
              adObject.mediaUrl
            ) {
              try {
                adObject.mediaUrl =
                  await getS3SignedUrl(
                    adObject.mediaUrl
                  );
              } catch (error) {
                console.error(
                  `Failed to generate ad image URL for ${adObject._id}:`,
                  error.message
                );

                adObject.mediaUrl =
                  null;
              }
            }

            /* ================= PRODUCT IMAGES ================= */

            if (
              adObject.product &&
              Array.isArray(
                adObject.product.media
              )
            ) {
              adObject.product.media =
                await Promise.all(
                  adObject.product.media.map(
                    async (
                      media
                    ) => {
                      if (
                        !media ||
                        !media.url
                      ) {
                        return media;
                      }

                      try {
                        return {
                          ...media,
                          url:
                            await getS3SignedUrl(
                              media.url
                            ),
                        };
                      } catch (error) {
                        console.error(
                          "Product image URL error:",
                          error.message
                        );

                        return {
                          ...media,
                          url: null,
                        };
                      }
                    }
                  )
                );
            }

            return adObject;
          }
        )
      );

    return res.status(200).json({
      success: true,
      count:
        adsWithImageUrl.length,
      ads:
        adsWithImageUrl,
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