const BusinessProfile = require("../models/BusinessProfile");
const BusinessInfo = require("../models/BusinessInfo");

const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;


/* =========================================================
   CREATE OR UPDATE BUSINESS PROFILE
   POST/PUT /api/seller/business-profile
   Content-Type: multipart/form-data
========================================================= */

exports.createOrUpdateProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const {
      businessEmail,
      supportEmail,
      supportPhone,
      language,
      timeZone,
      nationality,
      merchantId,
    } = req.body;

    let profile = await BusinessProfile.findOne({
      seller: sellerId,
    });


    /* =====================================================
       UPLOAD PROFILE IMAGE TO S3
    ===================================================== */

    let profileImageKey = profile?.profileImage || null;

    if (req.file) {
      const {
        originalname,
        mimetype,
        buffer,
        size,
      } = req.file;


      /* ================= IMAGE VALIDATION ================= */

      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];

      if (!allowedMimeTypes.includes(mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid image type. Only JPG, JPEG, PNG, WEBP and GIF are allowed.",
        });
      }


      const maxFileSize = 5 * 1024 * 1024;

      if (size > maxFileSize) {
        return res.status(400).json({
          success: false,
          message: "Image size must be less than 5 MB",
        });
      }


      /* ================= FILE EXTENSION ================= */

      const extension = originalname.includes(".")
        ? originalname.split(".").pop().toLowerCase()
        : "";


      /* ================= UNIQUE FILE NAME ================= */

      const uniqueFileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}` +
        `${extension ? "." + extension : ""}`;


      /* ================= S3 KEY ================= */

      const newProfileImageKey =
        `business-profiles/${sellerId}/${uniqueFileName}`;


      /* ================= UPLOAD TO S3 ================= */

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: newProfileImageKey,
        Body: buffer,
        ContentType: mimetype,
      });

      await s3.send(command);


      /* ===================================================
         DELETE OLD IMAGE FROM S3
         Only if a new image was uploaded
      =================================================== */

      if (profile?.profileImage) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: profile.profileImage,
          });

          await s3.send(deleteCommand);
        } catch (deleteError) {
          console.error(
            "Failed to delete old business profile image:",
            deleteError.message
          );
        }
      }


      profileImageKey = newProfileImageKey;
    }


    /* =====================================================
       PROFILE DATA
    ===================================================== */

    const updateData = {
      seller: sellerId,
      businessEmail,
      supportEmail,
      supportPhone,
      language,
      timeZone,
      nationality,
      merchantId,
      profileImage: profileImageKey,
    };


    /* =====================================================
       UPDATE EXISTING PROFILE
    ===================================================== */

    if (profile) {
      profile = await BusinessProfile.findOneAndUpdate(
        { seller: sellerId },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: {
          ...profile.toObject(),
          profileImage: profileImageKey,
        },
      });
    }


    /* =====================================================
       CREATE NEW PROFILE
    ===================================================== */

    profile = await BusinessProfile.create(updateData);


    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: {
        ...profile.toObject(),
        profileImage: profileImageKey,
      },
    });

  } catch (error) {
    console.error("Business Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET SELLER BUSINESS PROFILE
========================================================= */

exports.getProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const profile = await BusinessProfile.findOne({
      seller: sellerId,
    });

    const businessInfo = await BusinessInfo.findOne({
      seller: sellerId,
    });


    if (!profile && !businessInfo) {
      return res.status(404).json({
        success: false,
        message: "Seller profile data not found",
      });
    }


    /* =====================================================
       GENERATE SIGNED PROFILE IMAGE URL
    ===================================================== */

    let profileImageUrl = null;

    if (profile?.profileImage) {
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: profile.profileImage,
        });

        profileImageUrl = await getSignedUrl(
          s3,
          command,
          {
            expiresIn: 3600,
          }
        );
      } catch (error) {
        console.error(
          "Failed to generate profile image URL:",
          error.message
        );
      }
    }


    /* =====================================================
       RESPONSE
    ===================================================== */

    const responseData = {

      // ===== BusinessProfile =====

      profileImage: profileImageUrl,

      businessEmail:
        profile?.businessEmail || null,

      supportEmail:
        profile?.supportEmail || null,

      supportPhone:
        profile?.supportPhone || null,

      language:
        profile?.language || "English",

      timeZone:
        profile?.timeZone || "GMT+5:30",

      nationality:
        profile?.nationality || "Indian",

      merchantId:
        profile?.merchantId || null,


      // ===== BusinessInfo =====

      businessPersonName:
        businessInfo?.businessPersonName || null,

      businessName:
        businessInfo?.businessName || null,

      businessType:
        businessInfo?.businessType || null,

      gstin:
        businessInfo?.businessTaxId || null,

      businessContactNumber:
        businessInfo?.businessContactNumber || null,

      fullAddress: businessInfo
        ? `${businessInfo.addressLine1}, ${businessInfo.addressLine2}, ${businessInfo.city}, ${businessInfo.state}, ${businessInfo.country} - ${businessInfo.postalCode}`
        : null,
    };


    return res.status(200).json({
      success: true,
      data: responseData,
    });

  } catch (error) {
    console.error("Get Business Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   DELETE PROFILE
========================================================= */

exports.deleteProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const deleted = await BusinessProfile.findOneAndDelete({
      seller: sellerId,
    });


    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }


    /* =====================================================
       DELETE PROFILE IMAGE FROM S3
    ===================================================== */

    if (deleted.profileImage) {
      try {
        const command = new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: deleted.profileImage,
        });

        await s3.send(command);
      } catch (error) {
        console.error(
          "Failed to delete profile image from S3:",
          error.message
        );
      }
    }


    return res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });

  } catch (error) {
    console.error("Delete Business Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};