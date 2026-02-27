const BusinessProfile = require("../models/BusinessProfile");
const BusinessInfo = require("../models/BusinessInfo");

/* ================= CREATE OR UPDATE PROFILE ================= */
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
      profileImage,
    } = req.body;

    const updateData = {
      seller: sellerId,
      businessEmail,
      supportEmail,
      supportPhone,
      language,
      timeZone,
      nationality,
      merchantId,
      profileImage,
    };

    let profile = await BusinessProfile.findOne({ seller: sellerId });

    if (profile) {
      profile = await BusinessProfile.findOneAndUpdate(
        { seller: sellerId },
        updateData,
        { new: true, runValidators: true },
      );

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: profile,
      });
    }

    profile = await BusinessProfile.create(updateData);

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET SELLER PROFILE (COMBINED) ================= */
exports.getProfile = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const profile = await BusinessProfile.findOne({ seller: sellerId });
    const businessInfo = await BusinessInfo.findOne({ seller: sellerId });

    if (!profile && !businessInfo) {
      return res.status(404).json({
        success: false,
        message: "Seller profile data not found",
      });
    }

    const responseData = {
      // ===== From BusinessProfile =====
      profileImage: profile?.profileImage || null,
      businessEmail: profile?.businessEmail || null,
      supportEmail: profile?.supportEmail || null,
      supportPhone: profile?.supportPhone || null,
      language: profile?.language || "English",
      timeZone: profile?.timeZone || "GMT+5:30",
      nationality: profile?.nationality || "Indian",
      merchantId: profile?.merchantId || null,

      // ===== From BusinessInfo =====
      businessPersonName: businessInfo?.businessPersonName || null,
      businessName: businessInfo?.businessName || null,
      businessType: businessInfo?.businessType || null,
      gstin: businessInfo?.businessTaxId || null,
      businessContactNumber: businessInfo?.businessContactNumber || null,

      fullAddress: businessInfo
        ? `${businessInfo.addressLine1}, ${businessInfo.addressLine2}, ${businessInfo.city}, ${businessInfo.state}, ${businessInfo.country} - ${businessInfo.postalCode}`
        : null,
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE PROFILE ================= */
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

    res.status(200).json({
      success: true,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
