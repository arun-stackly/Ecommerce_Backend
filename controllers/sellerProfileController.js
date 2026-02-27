const SellerProfile = require("../models/SellerProfile");
const User = require("../models/User");

/* ================= GET SELLER PROFILE ================= */
exports.getSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const profile = await SellerProfile.findOne({ user: req.user._id });

    if (!user || !profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({
      id: user._id,
      fullName: `${user.firstName} ${user.lastName}`,
      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      joinedDate: user.createdAt,

      phone: profile.phone,
      address: profile.address,
      registeredContact: profile.registeredContact,
      profileImage: profile.profileImage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE SELLER PROFILE ================= */
exports.updateSellerProfile = async (req, res) => {
  try {
    const { phone, address, registeredContact, profileImage } = req.body;

    const profile = await SellerProfile.findOne({ user: req.user._id });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (phone) profile.phone = phone;
    if (address) profile.address = address;
    if (registeredContact) profile.registeredContact = registeredContact;
    if (profileImage) profile.profileImage = profileImage;

    await profile.save();

    res.status(200).json({
      message: "Seller profile updated successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
