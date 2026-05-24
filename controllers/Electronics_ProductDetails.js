const SellerInventory = require("../models/SellerInventory");

exports.getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await SellerInventory.findById(id)
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .populate("seller", "name email");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // increase views
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};