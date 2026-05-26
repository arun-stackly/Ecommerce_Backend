const ProductItem = require("../models/productitem");
const Banner = require("../models/Banner");

// =======================================================
// PRODUCT ITEM LANDING PAGE
// API:
// GET /api/home/product/:productItemId
// =======================================================

exports.getProductLandingPage = async (req, res) => {
  try {

    const { productItemId } = req.params;
    console.log("PARAM:", productItemId);

    // =========================================
    // CURRENT PRODUCT ITEM
    // =========================================
    const currentProduct =
      await ProductItem.findById(productItemId)
        .populate("sellerInventory");
console.log("FOUND PRODUCT:", currentProduct);
    if (!currentProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // =========================================
    // BANNER
    // =========================================
    const banner = await Banner.findOne({
      type: "monthly",
      isActive: true,
    });

    // =========================================
    // LATEST LAUNCHES
    // =========================================
    const latestLaunches =
      await ProductItem.find({
        _id: { $ne: productItemId },
      })
        .populate("sellerInventory")
        .sort({ createdAt: -1 })
        .limit(10);

    // =========================================
    // TOP DEAL
    // =========================================
    const topDeal =
      await ProductItem.findOne({
        _id: { $ne: productItemId },
      })
        .populate({
          path: "sellerInventory",
          match: {
            isFeatured: true,
            isActive: true,
          },
        })
        .sort({ createdAt: -1 });

    // =========================================
    // BEST SELLERS
    // =========================================
    const bestSellers =
      await ProductItem.find({
        _id: { $ne: productItemId },
      })
        .populate("sellerInventory")
        .sort({ createdAt: -1 })
        .limit(10);

    // =========================================
    // UPCOMING DEALS
    // =========================================
    const upcomingDeals =
      await ProductItem.find({
        _id: { $ne: productItemId },
      })
        .populate({
          path: "sellerInventory",
          match: {
            isFeatured: true,
            isActive: true,
          },
        })
        .sort({ createdAt: -1 })
        .limit(10);

    // =========================================
    // APPLE PRODUCTS
    // =========================================
    const appleProducts =
      await ProductItem.find({
        _id: { $ne: productItemId },
      })
        .populate({
          path: "sellerInventory",
          match: {
            "brands.name": "Apple",
            isActive: true,
          },
        })
        .limit(10);

    // =========================================
    // SAMSUNG PRODUCTS
    // =========================================
    const samsungProducts =
      await ProductItem.find({
        _id: { $ne: productItemId },
      })
        .populate({
          path: "sellerInventory",
          match: {
            "brands.name": "Samsung",
            isActive: true,
          },
        })
        .limit(10);

    // =========================================
    // OPPO PRODUCTS
    // =========================================
    const oppoProducts =
      await ProductItem.find({
        _id: { $ne: productItemId },
      })
        .populate({
          path: "sellerInventory",
          match: {
            "brands.name": "Oppo",
            isActive: true,
          },
        })
        .limit(10);

    // =========================================
    // VIVO PRODUCTS
    // =========================================
    const vivoProducts =
      await ProductItem.find({
        _id: { $ne: productItemId },
      })
        .populate({
          path: "sellerInventory",
          match: {
            "brands.name": "Vivo",
            isActive: true,
          },
        })
        .limit(10);

    // =========================================
    // FILTER NULL INVENTORIES
    // =========================================
    const filteredApple =
      appleProducts.filter(
        (item) => item.sellerInventory
      );

    const filteredSamsung =
      samsungProducts.filter(
        (item) => item.sellerInventory
      );

    const filteredOppo =
      oppoProducts.filter(
        (item) => item.sellerInventory
      );

    const filteredVivo =
      vivoProducts.filter(
        (item) => item.sellerInventory
      );

    // =========================================
    // RESPONSE
    // =========================================
    res.status(200).json({
      success: true,

      banner,

      currentProduct,

      latestLaunches,

      topDeal,

      bestSellers,

      upcomingDeals,

      brandProducts: {
        apple: filteredApple,
        samsung: filteredSamsung,
        oppo: filteredOppo,
        vivo: filteredVivo,
      },
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};