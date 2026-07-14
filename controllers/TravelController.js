const TravelHomepage = require("../models/Travel");

exports.createHomepage = async (req, res) => {
  try {
    const homepage = await TravelHomepage.create(req.body);

    res.status(201).json({
      success: true,
      message: "Homepage created successfully",
      data: homepage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getHomepageBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    const homepage = await TravelHomepage.findOne({
      subcategory: subcategoryId,
      isActive: true,
    })
      .populate("category", "name")
      .populate("subcategory", "name");

    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: "Homepage not found",
      });
    }

    res.status(200).json({
      success: true,
      data: homepage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.updateHomepage = async (req, res) => {
  try {
    const homepage = await TravelHomepage.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: "Homepage not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Homepage updated successfully",
      data: homepage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.deleteHomepage = async (req, res) => {
  try {
    const homepage = await TravelHomepage.findByIdAndDelete(req.params.id);

    if (!homepage) {
      return res.status(404).json({
        success: false,
        message: "Homepage not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Homepage deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getAllHomepages = async (req, res) => {
  try {
    const homepages = await TravelHomepage.find({ isActive: true })
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: homepages.length,
      data: homepages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};