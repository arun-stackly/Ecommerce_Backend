const Product = require("../models/Product");
const SellerInventory = require("../models/SellerInventory");
const UserAuth = require("../models/UserAuth");
const UserOrder = require("../models/UserOrder")
const mongoose = require("mongoose"); // ✅ Add this

// ==============================
// ✅ 1. ADD PRODUCT
// ==============================
exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      subcategory,
      subSubcategory,
      brands,
      discountPrice,
      sizes,
      stock,
      images
    } = req.body;

    // ✅ Required field validation
    if (!name || !category || !subcategory || !subSubcategory) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    // ✅ Brand validation (VERY IMPORTANT)
    if (brands && brands.length > 0) {
      const isValidBrand = brands.every(
        (b) => b.name && typeof b.name === "string"
      );

      if (!isValidBrand) {
        return res.status(400).json({
          success: false,
          message: "Invalid brand format. Use { name, logo }",
        });
      }
    }

    // ✅ Size validation
    if (sizes && sizes.length > 0) {
      const isValidSizes = sizes.every(
        (s) => s.size && typeof s.quantity === "number"
      );

      if (!isValidSizes) {
        return res.status(400).json({
          success: false,
          message: "Invalid sizes format",
        });
      }
    }

    // ✅ Auto calculate stock from sizes (BEST PRACTICE)
    let totalStock = stock || 0;

    if (sizes && sizes.length > 0) {
      totalStock = sizes.reduce((acc, item) => acc + item.quantity, 0);
    }

    // ✅ Create product
    const product = new Product({
      name,
      description,
      category,
      subcategory,
      subSubcategory,
      brands,
      discountPrice,
      sizes,
      stock: totalStock,
      images,
      ...req.body // optional extra fields
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });

  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
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

    // ✅ FIXED BRAND FILTER
    if (brand) {
      filter["brands.name"] = { $in: brand.split(",") };
    }

    // ✅ FIXED PRICE FILTER
    if (minPrice || maxPrice) {
      filter.discountPrice = {};
      if (minPrice) filter.discountPrice.$gte = Number(minPrice);
      if (maxPrice) filter.discountPrice.$lte = Number(maxPrice);
    }

    if (rating) filter.rating = { $gte: Number(rating) };

    if (discount === "true") {
      filter.discountPrice = { $exists: true, $ne: null };
    }

    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }

    let sortOption = {};
    if (sort === "price_asc") sortOption.discountPrice = 1;
    else if (sort === "price_desc") sortOption.discountPrice = -1;
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
exports.addProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id; // Product _id from URL
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // ✅ Check if user purchased and order is delivered
    const deliveredOrder = await UserOrder.findOne({
      customerId: userId,
      "items.productId": productId, // use req.params.id
      orderStatus: "delivered",
    });

    if (!deliveredOrder) {
      return res.status(403).json({
        success: false,
        message: "You can review only delivered products you purchased",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const alreadyReviewed = product.reviews.find(
      (review) => review.user.toString() === userId.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = {
      user: userId,
      name: req.user.firstName, // ✅ use firstName
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    product.reviewCount = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => acc + item.rating, 0) /
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