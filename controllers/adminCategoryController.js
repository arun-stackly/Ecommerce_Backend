const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");
const SubSubcategory = require("../models/SubSubcategory");
const ProductType = require("../models/ProductType");
const SellerInventory = require("../models/SellerInventory");

exports.getCategorySummary = async (req, res) => {
  try {
    const [
      categoryCount,
      subcategoryCount,
      subSubcategoryCount,
      productTypeCount
    ] = await Promise.all([
      Category.countDocuments(),
      Subcategory.countDocuments(),
      SubSubcategory.countDocuments(),
      ProductType.countDocuments()
    ]);

    res.status(200).json({
      success: true,
      data: {
        categories: categoryCount,
        subcategories: subcategoryCount,
        subSubcategories: subSubcategoryCount,
        productTypes: productTypeCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
exports.getCategoriesWithProductCount = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: "sellerinventories",
          localField: "_id",
          foreignField: "category",
          as: "products"
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          productCount: {
            $size: "$products"
          },
          status: {
            $literal: "Active"
          }
        }
      },
      {
        $sort: {
          name: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categories
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};