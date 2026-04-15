const Specification = require("../models/ProductSpecification");
const Product = require("../models/Product");

// API

// POST /api/specifications/:productId
exports.addSpecifications = async (req, res) => {
  try {
    const { productId } = req.params;
    const { specs } = req.body;

    // check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // prevent duplicate
    const existing = await Specification.findOne({ product: productId });
    if (existing) {
      return res.status(400).json({
        message: "Specifications already exist. Use update API."
      });
    }

    const specification = await Specification.create({
      product: productId,
      specs
    });

    res.status(201).json({
      success: true,
      specification
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/specifications/:productId
exports.getSpecifications = async (req, res) => {
  try {
    const { productId } = req.params;

    const specification = await Specification.findOne({
      product: productId
    });

    if (!specification) {
      return res.status(404).json({
        message: "Specifications not found"
      });
    }

    res.json({
      success: true,
      specs: specification.specs
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/specifications/:productId
exports.updateSpecifications = async (req, res) => {
  try {
    const { productId } = req.params;
    const { specs } = req.body;

    const specification = await Specification.findOneAndUpdate(
      { product: productId },
      { specs },
      { new: true }
    );

    if (!specification) {
      return res.status(404).json({
        message: "Specifications not found"
      });
    }

    res.json({
      success: true,
      specification
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/specifications/:productId
exports.deleteSpecifications = async (req, res) => {
  try {
    const { productId } = req.params;

    const specification = await Specification.findOneAndDelete({
      product: productId
    });

    if (!specification) {
      return res.status(404).json({
        message: "Specifications not found"
      });
    }

    res.json({
      success: true,
      message: "Specifications deleted"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};