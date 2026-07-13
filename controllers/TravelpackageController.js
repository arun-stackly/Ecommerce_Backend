const TravelPackage = require("../models/Travelpackage");

exports.createTravelPackage = async (req, res) => {
  try {
    const travelPackage = await TravelPackage.create(req.body);

    res.status(201).json({
      success: true,
      message: "Travel package created successfully",
      data: travelPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getTravelPackages = async (req, res) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      latest,
      featured,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      isActive: true,
    };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;

    if (latest === "true") filter.isLatest = true;

    if (featured === "true") filter.isFeatured = true;

    if (search) {
      filter.title = {
        $regex: search,
        $options: "i",
      };
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const packages = await TravelPackage.find(filter)
      .populate("category", "name")
      .populate("brand", "name logo")
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await TravelPackage.countDocuments(filter);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      data: packages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getTravelPackageById = async (req, res) => {
  try {
    const travelPackage = await TravelPackage.findById(req.params.id)
      .populate("category", "name")
      .populate("brand", "name logo");

    if (!travelPackage) {
      return res.status(404).json({
        success: false,
        message: "Travel package not found",
      });
    }

    res.json({
      success: true,
      data: travelPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateTravelPackage = async (req, res) => {
  try {
    const travelPackage = await TravelPackage.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!travelPackage) {
      return res.status(404).json({
        success: false,
        message: "Travel package not found",
      });
    }

    res.json({
      success: true,
      message: "Travel package updated successfully",
      data: travelPackage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteTravelPackage = async (req, res) => {
  try {
    const travelPackage = await TravelPackage.findByIdAndDelete(req.params.id);

    if (!travelPackage) {
      return res.status(404).json({
        success: false,
        message: "Travel package not found",
      });
    }

    res.json({
      success: true,
      message: "Travel package deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};