const Product = require("../models/Product");


// ==============================
// ✅ 1. ADD PRODUCT
// ==============================
exports.addProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==============================
// ✅ 2. GET ALL PRODUCTS (FILTER + PAGINATION)
// ==============================
exports.getProducts = async (req, res) => {
  try {
    const {
      category,
      brand,
      minPrice,
      maxPrice,
      rating,
      discount,
      inStock,
      sort,
      page = 1,
      limit = 10,
    } = req.query;

    let filter = { status: "active" };

    if (category) filter.category = category;

    if (brand) filter.brand = { $in: brand.split(",") };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (rating) filter.rating = { $gte: Number(rating) };

    // Correct discount filter
    if (discount === "true") {
      filter.discountPrice = { $exists: true, $ne: null };
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    let sortOption = {};
    if (sort === "price_asc") sortOption.price = 1;
    else if (sort === "price_desc") sortOption.price = -1;
    else if (sort === "newest") sortOption.createdAt = -1;
    else if (sort === "rating_desc") sortOption.rating = -1;

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      products,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==============================
// ✅ 3. GET SINGLE PRODUCT BY ID
// ==============================
exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==============================
// ✅ 4. UPDATE PRODUCT
// ==============================
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product updated successfully",
      updatedProduct,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ==============================
// ✅ 5. DELETE PRODUCT
// ==============================
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({
      message: "Product deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};