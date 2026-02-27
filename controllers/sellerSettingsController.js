const User = require("../models/User");
const SellerProfile = require("../models/SellerProfile");
const bcrypt = require("bcryptjs");

/* ================= GET SELLER SETTINGS ================= */
exports.getSellerSettings = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select("-password");
    const sellerProfile = await SellerProfile.findOne({ user: userId });

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
        registeredContact: sellerProfile?.registeredContact || null,
        profileImage: sellerProfile?.profileImage || null,
      },
    });
  } catch (error) {
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
    const { phone, address, registeredContact, profileImage } = req.body;

    let profile = await SellerProfile.findOne({ user: userId });

    if (profile) {
      profile = await SellerProfile.findOneAndUpdate(
        { user: userId },
        { phone, address, registeredContact, profileImage },
        { new: true, runValidators: true },
      );
    } else {
      profile = await SellerProfile.create({
        user: userId,
        phone,
        address,
        registeredContact,
        profileImage,
      });
    }

    res.status(200).json({
      success: true,
      message: "Seller details updated successfully",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= CHANGE PASSWORD ================= */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // 1️⃣ Check required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    // 2️⃣ Check new password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    const user = await User.findById(req.user._id);

    // 3️⃣ Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 4️⃣ Optional: Prevent same password reuse
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // 5️⃣ Save new password (hash will run in pre-save middleware)
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
      { new: true },
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
