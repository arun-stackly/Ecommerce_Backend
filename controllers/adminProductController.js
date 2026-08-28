const mongoose = require("mongoose");
const SellerInventory = require("../models/SellerInventory");

// Low-stock threshold.
// Change this to whatever your business considers "low stock".
const LOW_STOCK_THRESHOLD = 5;

/**
 * GET /api/admin/products/summary
 *
 * Returns:
 * - Total Products
 * - Low Stock
 * - Out of Stock
 */
exports.getProductSummary = async (req, res) => {
  try {
    const [result] = await SellerInventory.aggregate([
      {
        $group: {
          _id: null,

          totalProducts: {
            $sum: 1,
          },

          lowStock: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$quantity", 0] },
                    { $lte: ["$quantity", LOW_STOCK_THRESHOLD] },
                  ],
                },
                1,
                0,
              ],
            },
          },

          outOfStock: {
            $sum: {
              $cond: [{ $lte: ["$quantity", 0] }, 1, 0],
            },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalProducts: result?.totalProducts || 0,
        lowStock: result?.lowStock || 0,
        outOfStock: result?.outOfStock || 0,
      },
    });
  } catch (error) {
    console.error("getProductSummary:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product summary",
      error: error.message,
    });
  }
};
/**
 * GET /api/admin/products/category-stats
 */
exports.getProductCategoryStats = async (req, res) => {
  try {
    const stats = await SellerInventory.aggregate([
      {
        $match: {
          isActive: true,
        },
      },

      {
        $group: {
          _id: "$category",
          productCount: {
            $sum: 1,
          },
        },
      },

      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },

      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,

          categoryId: "$_id",

          categoryName: {
            $ifNull: ["$category.name", "Unknown"],
          },

          productCount: 1,
        },
      },

      {
        $sort: {
          productCount: -1,
        },
      },
    ]);

    const total = stats.reduce(
      (sum, item) => sum + item.productCount,
      0
    );

    const data = stats.map((item) => ({
      ...item,
      percentage:
        total > 0
          ? Number(((item.productCount / total) * 100).toFixed(1))
          : 0,
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("getProductCategoryStats:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category statistics",
      error: error.message,
    });
  }
};
/**
 * GET /api/admin/products
 *
 * Query:
 * ?page=1
 * &limit=10
 * &search=iphone
 * &categoryId=xxx
 * &stockStatus=all|in_stock|low_stock|out_of_stock
 * &sortBy=createdAt
 * &sortOrder=desc
 */
exports.getAdminProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      categoryId,
      stockStatus = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    const skip = (page - 1) * limit;

    const filter = {};

    // -------------------------
    // Search
    // -------------------------

    if (search.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          "brand.name": {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // -------------------------
    // Category
    // -------------------------

    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid categoryId",
        });
      }

      filter.category = categoryId;
    }

    // -------------------------
    // Stock Status
    // -------------------------

    if (stockStatus === "out_of_stock") {
      filter.quantity = {
        $lte: 0,
      };
    }

    if (stockStatus === "low_stock") {
      filter.quantity = {
        $gt: 0,
        $lte: LOW_STOCK_THRESHOLD,
      };
    }

    if (stockStatus === "in_stock") {
      filter.quantity = {
        $gt: LOW_STOCK_THRESHOLD,
      };
    }

    // -------------------------
    // Only active products
    // -------------------------

    filter.isActive = true;

    // -------------------------
    // Allowed sorting fields
    // -------------------------

    const allowedSortFields = [
      "name",
      "price",
      "quantity",
      "rating",
      "reviewCount",
      "soldCount",
      "views",
      "createdAt",
      "updatedAt",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    const sortDirection =
      sortOrder === "asc" ? 1 : -1;

    const sort = {
      [sortBy]: sortDirection,
    };

    // -------------------------
    // Query
    // -------------------------

    const [products, total] = await Promise.all([
      SellerInventory.find(filter)
        .populate("category", "name")
        .select(
          `
          name
          category
          price
          quantity
          rating
          media
          isActive
          createdAt
          updatedAt
          `
        )
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      SellerInventory.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,

      data: products,

      pagination: {
        total,
        page,
        limit,
        totalPages,

        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("getAdminProducts:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};
/**
 * GET /api/admin/products/:id
 */
exports.getAdminProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await SellerInventory.findById(id)
      .populate("seller", "name email")
      .populate("category", "name")
      .populate("subcategory", "name")
      .populate("subSubcategory", "name")
      .populate("productType", "name")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("getAdminProductById:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};
