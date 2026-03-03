const Product = require("../models/Product");
const UserAuth = require("../models/UserAuth");
const UserOrder = require("../models/UserOrder")
const mongoose = require("mongoose"); // ✅ Add this

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
/* ================= ADD PRODUCT REVIEW ================= */
exports.addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    const userId = req.user._id;

    // 1️⃣ Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // 2️⃣ Check if user purchased & order delivered
    const deliveredOrder = await UserOrder.findOne({
      customer: userId,
       "items.productId": productId,
      orderStatus: "delivered",
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: "You can review only delivered products you purchased",
      });
    }

    // 3️⃣ Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 4️⃣ Prevent duplicate review
    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // 5️⃣ Create review object
    const review = {
      user: userId,
      name: req.user.name,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);

    // 6️⃣ Update rating & review count
    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();

    res.status(201).json({
      success: true,
      message: "Review added successfully",
    });
  } catch (error) {
    console.error("Add Review Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};