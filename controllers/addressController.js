const Address = require("../models/addressModel");

/* ================= GET USER ADDRESSES ================= */
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      userId: req.user._id,
    }).sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: addresses.length,
      data: addresses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= ADD ADDRESS ================= */
exports.addAddress = async (req, res) => {
  try {
    const addressCount = await Address.countDocuments({
      userId: req.user._id,
    });

    const address = await Address.create({
      ...req.body,
      userId: req.user._id,
      isDefault: addressCount === 0, // First address becomes default
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE ADDRESS ================= */
exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    Object.assign(address, req.body);

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE ADDRESS ================= */
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const wasDefault = address.isDefault;

    await address.deleteOne();

    // If deleted address was default,
    // make another address default automatically
    if (wasDefault) {
      const nextAddress = await Address.findOne({
        userId: req.user._id,
      }).sort({ createdAt: 1 });

      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Address removed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= SET DEFAULT ADDRESS ================= */
exports.setDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await Address.updateMany(
      { userId: req.user._id },
      { isDefault: false }
    );

    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET DEFAULT ADDRESS ================= */
exports.getDefaultAddress = async (req, res) => {
  try {
    const address = await Address.findOne({
      userId: req.user._id,
      isDefault: true,
    });

    res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};