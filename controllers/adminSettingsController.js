const AdminSettings = require("../models/AdminSettings");

// ==========================================
// GET ADMIN SETTINGS
// ==========================================
const getAdminSettings = async (req, res) => {
  try {
    let settings = await AdminSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await AdminSettings.create({
        adminName: "E-Commerce Admin Panel",
        adminEmail: "support@ecommerce.com",
        maintenanceMode: false,
        autoApproveSellerAds: false,
        emailAlerts: true,
      });
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get Admin Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get admin settings",
    });
  }
};


// ==========================================
// UPDATE ADMIN SETTINGS
// ==========================================
const updateAdminSettings = async (req, res) => {
  try {
    const {
      adminName,
      adminEmail,
      maintenanceMode,
      autoApproveSellerAds,
      emailAlerts,
    } = req.body;

    // Basic validation
    if (!adminName || !adminEmail) {
      return res.status(400).json({
        success: false,
        message: "Admin name and email are required",
      });
    }

    let settings = await AdminSettings.findOne();

    // If settings don't exist, create them
    if (!settings) {
      settings = await AdminSettings.create({
        adminName,
        adminEmail,
        maintenanceMode: Boolean(maintenanceMode),
        autoApproveSellerAds: Boolean(autoApproveSellerAds),
        emailAlerts:
          emailAlerts === undefined
            ? true
            : Boolean(emailAlerts),
      });
    } else {
      settings.adminName = adminName;
      settings.adminEmail = adminEmail;

      settings.maintenanceMode =
        maintenanceMode === true ||
        maintenanceMode === "true";

      settings.autoApproveSellerAds =
        autoApproveSellerAds === true ||
        autoApproveSellerAds === "true";

      settings.emailAlerts =
        emailAlerts === true ||
        emailAlerts === "true";

      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Update Admin Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update admin settings",
    });
  }
};


module.exports = {
  getAdminSettings,
  updateAdminSettings,
};
