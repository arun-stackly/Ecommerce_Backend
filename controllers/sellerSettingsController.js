const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const bcrypt = require("bcryptjs");

const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/* ================= GET SELLER SETTINGS ================= */

exports.getSellerSettings = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");
    const sellerProfile = await SellerProfile.findOne({ user: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate signed profile image URL
    let profileImageUrl = null;

    if (sellerProfile?.profileImage) {
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: sellerProfile.profileImage,
        });

        profileImageUrl = await getSignedUrl(s3, command, {
          expiresIn: 3600,
        });
      } catch (error) {
        console.error(
          "Failed to generate profile image URL:",
          error.message
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        // ===== USER DATA =====
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,

        // ===== SELLER PROFILE DATA =====
        phone: sellerProfile?.phone || null,
        address: sellerProfile?.address || null,
        registeredContact:
          sellerProfile?.registeredContact || null,

        profileImage: profileImageUrl,
      },
    });
  } catch (error) {
    console.error("Get Seller Settings Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ================= UPDATE SELLER DETAILS ================= */

exports.updateSellerDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      phone,
      address,
      registeredContact,
    } = req.body;

    let profile = await SellerProfile.findOne({
      user: userId,
    });

    // Keep existing S3 image if no new image is uploaded
    let profileImageKey = profile?.profileImage || null;

    /* ================= S3 IMAGE UPLOAD ================= */

    if (req.file) {
      const {
        originalname,
        mimetype,
        buffer,
        size,
      } = req.file;

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

      const extension = originalname.includes(".")
        ? originalname.split(".").pop().toLowerCase()
        : "";

      const uniqueFileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}` +
        `${extension ? "." + extension : ""}`;

      const newProfileImageKey =
        `seller-settings/${userId}/${uniqueFileName}`;

      // Upload new image to S3
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: newProfileImageKey,
          Body: buffer,
          ContentType: mimetype,
        })
      );

      // Save new key
      profileImageKey = newProfileImageKey;

      // Delete old image from S3
      if (profile?.profileImage) {
        try {
          await s3.send(
            new DeleteObjectCommand({
              Bucket: BUCKET_NAME,
              Key: profile.profileImage,
            })
          );
        } catch (deleteError) {
          console.error(
            "Failed to delete old seller profile image:",
            deleteError.message
          );
        }
      }
    }

    /* ================= UPDATE MONGODB ================= */

    if (profile) {
      profile = await SellerProfile.findOneAndUpdate(
        { user: userId },
        {
          phone,
          address,
          registeredContact,
          profileImage: profileImageKey,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
      profile = await SellerProfile.create({
        user: userId,
        phone,
        address,
        registeredContact,
        profileImage: profileImageKey,
      });
    }

    res.status(200).json({
      success: true,
      message: "Seller details updated successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Update Seller Details Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ================= DELETE SELLER PROFILE IMAGE ================= */

exports.deleteSellerProfileImage = async (req, res) => {
  try {
    const userId = req.user._id;

    const profile = await SellerProfile.findOne({
      user: userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Seller profile not found",
      });
    }

    if (!profile.profileImage) {
      return res.status(404).json({
        success: false,
        message: "Profile image not found",
      });
    }

    // Delete image from S3
    await s3.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: profile.profileImage,
      })
    );

    // Remove image key from MongoDB
    profile.profileImage = null;

    await profile.save();

    res.status(200).json({
      success: true,
      message: "Seller profile image deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Seller Profile Image Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ================= CHANGE PASSWORD ================= */

exports.changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password do not match",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ================= UPDATE NOTIFICATIONS ================= */

exports.updateNotifications = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { notifications: req.body },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      data: user.notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};