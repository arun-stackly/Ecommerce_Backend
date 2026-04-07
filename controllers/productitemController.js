const Product = require("../models/productitem");

exports.addProduct = async (req, res) => {

  try {

    const slug = req.body.name.toLowerCase().replace(/\s+/g, "-");

    const product = new Product({
      ...req.body,
      slug
    });

    await product.save();
    console.log(product);
    res.status(201).json({
      message: "Product created",
      product
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
exports.getProducts = async (req, res) => {

  try {

    const products = await Product.find()
      .populate("category")
      .populate("subcategory")
      .populate("subSubcategory");

    res.json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
exports.getProductsBySubSubcategory = async (req, res) => {

  try {

    const products = await Product.find({
      subSubcategory: req.params.subSubcategoryId
    });

    res.json(products);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
exports.getProductsByType = async (req, res) => {
  try {

    const { productType } = req.params;

    const products = await Product.find({
      productType: productType
    })
      .populate("category")
      .populate("subcategory")
      .populate("subSubcategory");

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
exports.getProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    const products = await Product.find({
      subcategory: subcategoryId
    })
      .populate("category")
      .populate("subcategory");

    res.json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
exports.getProductsByTypeAndSubSubCategory = async (req, res) => {
  try {

    const { productType, subSubcategoryId } = req.query;

    let filter = {};

    if (productType) filter.productType = productType;
    if (subSubcategoryId) filter.subSubcategory = subSubcategoryId;

    const products = await Product.find(filter)
      .populate("category subcategory subSubcategory");

    res.json(products);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
exports.updateProduct = async (req, res) => {

  try {

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(product);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};
exports.deleteProduct = async (req, res) => {

  try {

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      message: "Product deleted"
    });

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }

};