// controllers/homeController.js

const SellerInventory =
  require("../models/SellerInventory");

const Banner =
  require("../models/Banner");
  const ProductItem =
  require("../models/productitem");

/* =========================================
   GET BANNERS
   GET /api/home/banners
========================================= */

exports.getBanners =
  async (req, res) => {

    try {

      const banners =
        await Banner.find({
          isActive: true,
        })

        .sort({
          createdAt: -1,
        });

      const response =
        banners.map((banner) => ({

          id: banner._id,

          image:
            banner.image,

          redirectUrl:
            banner.redirectUrl,

          title:
            banner.title,

        }));

      res.status(200).json({
        success: true,
        banners: response,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
};


/* =========================================
   BEST SELLERS
   GET /api/home/best-sellers
========================================= */


/* =========================================
   BEST SELLERS
========================================= */

exports.getBestSellers =
  async (req, res) => {

    try {

      const { categoryId } =
        req.params;

      const products =
        await ProductItem.find({

          category: categoryId,

        })

        .populate({

          path: "sellerInventory",

          match: {
            isActive: true,
          },

          select:
            "name description price media rating soldCount",
        });

      /* =========================
         REMOVE NULL VALUES
      ========================= */

      const response =
        products

          .filter(
            (item) =>
              item.sellerInventory
          )

          .map(
            (item) =>
              item.sellerInventory
          )

          .sort(
            (a, b) =>
              b.soldCount - a.soldCount
          )

          .slice(0, 10);

      res.status(200).json({

        success: true,

        count:
          response.length,

        products: response,
      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,
      });

    }
};



/* =========================================
   TOP RATED PRODUCTS
   GET /api/home/top-rated
========================================= */

exports.getTopRatedProducts =
  async (req, res) => {

    try {

      const { categoryId } =
        req.params;

      const products =
        await ProductItem.find({

          category: categoryId,

        })

        .populate({

          path: "sellerInventory",

          match: {
            isActive: true,
          },

          select:
            "name description price media rating",
        });

      const response =
        products

          .filter(
            (item) =>
              item.sellerInventory
          )

          .map(
            (item) =>
              item.sellerInventory
          )

          .sort(
            (a, b) =>
              b.rating - a.rating
          )

          .slice(0, 10);

      res.status(200).json({

        success: true,

        products: response,
      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,
      });

    }
};

/* =========================================
   RECOMMENDED PRODUCTS
   GET /api/home/recommended
========================================= */

exports.getRecommendedProducts =
  async (req, res) => {

    try {

      const { categoryId } =
        req.params;

      const products =
        await ProductItem.find({

          category: categoryId,

        })

        .populate({

          path: "sellerInventory",

          match: {

            isFeatured: true,

            isActive: true,
          },

          select:
            "name description price media rating",
        });

      const response =
        products

          .filter(
            (item) =>
              item.sellerInventory
          )

          .map(
            (item) =>
              item.sellerInventory
          )

          .slice(0, 10);

      res.status(200).json({

        success: true,

        products: response,
      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,
      });

    }
};
/* =========================================
   SEARCH PRODUCTS CATEGORY WISE
   GET /api/home/:categoryId/search?q=iphone
========================================= */

exports.searchProducts =
  async (req, res) => {

    try {

      const { categoryId } =
        req.params;

      const { q } =
        req.query;

      if (!q) {

        return res.status(400).json({
          success: false,
          message:
            "Search query is required",
        });
      }

      /* =========================
         FIND PRODUCT ITEMS
      ========================= */

      const productItems =
        await ProductItem.find({

          category: categoryId,

        })

        .populate({

          path: "sellerInventory",

          match: {

            name: {
              $regex: q,
              $options: "i",
            },

            isActive: true,
          },

          select:
            "name description price media rating",
        });

      /* =========================
         REMOVE NULL VALUES
      ========================= */

      const products =
        productItems

          .filter(
            (item) =>
              item.sellerInventory
          )

          .map(
            (item) =>
              item.sellerInventory
          );

      res.status(200).json({

        success: true,

        count:
          products.length,

        products,
      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message:
          error.message,
      });

    }
};

/* =========================================

   TOP SALE OF THE MONTH

========================================= */
 
exports.getTopSaleOfMonth = async (req, res) => {

  try {

    const { categoryId } = req.params;
 
    const products = await ProductItem.find({

      category: categoryId,

    }).populate({

      path: "sellerInventory",

      match: {

        isActive: true,

      },

      select:

        "name description price media rating soldCount",

    });
 
    const response = products

      .filter((item) => item.sellerInventory)

      .map((item) => item.sellerInventory)

      .sort((a, b) => b.soldCount - a.soldCount);
 
    res.status(200).json({

      success: true,

      products: response,

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
 
/* =========================================

   LOW TO HIGH PRICE

========================================= */
 
exports.getPriceLowToHigh = async (req, res) => {

  try {

    const { categoryId } = req.params;
 
    const products = await ProductItem.find({

      category: categoryId,

    }).populate({

      path: "sellerInventory",

      match: {

        isActive: true,

      },

      select:

        "name description price media rating soldCount",

    });
 
    const response = products

      .filter((item) => item.sellerInventory)

      .map((item) => item.sellerInventory)

      .sort((a, b) => a.price - b.price);
 
    res.status(200).json({

      success: true,

      products: response,

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
 
/* =========================================

   HIGH TO LOW PRICE

========================================= */
 
exports.getPriceHighToLow = async (req, res) => {

  try {

    const { categoryId } = req.params;
 
    const products = await ProductItem.find({

      category: categoryId,

    }).populate({

      path: "sellerInventory",

      match: {

        isActive: true,

      },

      select:

        "name description price media rating soldCount",

    });
 
    const response = products

      .filter((item) => item.sellerInventory)

      .map((item) => item.sellerInventory)

      .sort((a, b) => b.price - a.price);
 
    res.status(200).json({

      success: true,

      products: response,

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};
 