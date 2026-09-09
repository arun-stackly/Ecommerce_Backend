AdminAuthController
const jwt = require("jsonwebtoken");
 
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
 
    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }
 
    // Check admin credentials from .env
    if (
      email.toLowerCase().trim() !==
      process.env.ADMIN_EMAIL.toLowerCase().trim() ||
      password !== process.env.ADMIN_PASSWORD
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
 
    const admin = {
      email: process.env.ADMIN_EMAIL,
      role: "admin",
    };
 
    // Access Token
    const accessToken = jwt.sign(
      {
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "6hrs",
      }
    );
 
    // Refresh Token
    const refreshToken = jwt.sign(
      {
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: "7d",
      }
    );
 
    // Store refresh token in HttpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
 
    return res.status(200).json({
      success: true,
      message: "Admin login successful",
 
      // Frontend gets only access token
      accessToken,
 
      admin: {
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
 
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const refreshAccessToken = async (req, res) => {
  try {
    console.log("Refresh token received:", !!req.cookies.refreshToken);
    console.log("Refresh secret exists:", !!process.env.JWT_REFRESH_SECRET);
    const refreshToken = req.cookies.refreshToken;
 
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found",
      });
    }
 
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
 
    const newAccessToken = jwt.sign(
      {
        email: decoded.email,
        role: decoded.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "6hrs",
      }
    );
 
    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
 
    return res.status(401).json({
      success: false,
      message: "Refresh token expired or invalid. Please login again.",
    });
  }
};
 
 
const adminLogout = async (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      path: "/",
    });
 
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);
 
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
module.exports = {
  adminLogin,
  refreshAccessToken,
  adminLogout,
};
 