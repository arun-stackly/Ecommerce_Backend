const FAQ = require("../models/FaqModel");

/* ======================
   CREATE FAQ
====================== */
exports.createFaq = async (req, res) => {
  try {
    const { question, answer, order } =
      req.body;

    const faq = await FAQ.create({
      question,
      answer,
      order,
    });

    return res.status(201).json({
      success: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================
   GET ALL FAQS
====================== */
exports.getFaqs = async (req, res) => {
  try {
    const faqs = await FAQ.find({
      isActive: true,
    }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      count: faqs.length,
      data: faqs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================
   GET SINGLE FAQ
====================== */
exports.getFaqById = async (
  req,
  res
) => {
  try {
    const faq = await FAQ.findById(
      req.params.id
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================
   UPDATE FAQ
====================== */
exports.updateFaq = async (
  req,
  res
) => {
  try {
    const faq = await FAQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "FAQ updated successfully",
      data: faq,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================
   DELETE FAQ
====================== */
exports.deleteFaq = async (
  req,
  res
) => {
  try {
    const faq = await FAQ.findByIdAndDelete(
      req.params.id
    );

    if (!faq) {
      return res.status(404).json({
        success: false,
        message: "FAQ not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "FAQ deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};