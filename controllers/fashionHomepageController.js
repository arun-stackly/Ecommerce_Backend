const mongoose = require("mongoose");

const SellerInventory =
  require("../models/SellerInventory");

const Banner =
  require("../models/Banner");

const Deal =
  require("../models/Deal");


// ======================================================
// FASHION CATEGORY LANDING PAGE
// API:
// GET /api/fashion/home/:categoryId
// ======================================================

exports.getFashionLandingPage =
  async (req, res) => {

    try {

      // =========================================
      // HARDCODE CATEGORY ID
      // =========================================
      const categoryId =
        "69367661e9c011d0457e1812";


      const currentDate =
        new Date();

      // =========================================
      // 1. Homepage BANNER
      // =========================================
      const banner =
        await Banner.findOne({
          category: categoryId,

          type: "homepage",

          isActive: true,

        });


      // =========================================
      // 2. LATEST LAUNCHES
      // =========================================
      const latestLaunches =
        await SellerInventory.find({

          category: categoryId,

          isActive: true,

        })
          .sort({ createdAt: -1 })
          .limit(10);


      // =========================================
      // 3. TOP DEAL OF THE WEEK
      // =========================================
      const topDeal =
        await SellerInventory.findOne({

          category: categoryId,

          isFeatured: true,

          isActive: true,

        })
          .sort({ views: -1 });


      // =========================================
      // 4. SALE OF THE DAY
      // =========================================
      const saleOfDay =
        await SellerInventory.find({

          category: categoryId,

          isActive: true,

          isSaleOfDay: true,

          saleStartDate: {
            $lte: currentDate,
          },

          saleEndDate: {
            $gte: currentDate,
          },

        })
          .sort({ createdAt: -1 })
          .limit(10);


      // =========================================
      // 5. UPCOMING DEALS
      // =========================================
     const upcomingDeals =
  await Deal.find({

    category: categoryId,

    type: "upcoming",

    isActive: true,

  })
    .populate({
      path: "sellerInventoryId",
      model: "SellerInventory",
    })
    .limit(10);

      // =========================================
      // 6. TOP BRANDS
      // =========================================
      const topBrands =
        await SellerInventory.aggregate([

          {
            $match: {

              category:
                new mongoose.Types.ObjectId(
                  categoryId
                ),

              isActive: true,

            },
          },

          {
            $unwind: "$brands",
          },

          {
            $group: {

              _id: "$brands.name",

              logo: {
                $first:
                  "$brands.logo",
              },

              totalProducts: {
                $sum: 1,
              },

            },
          },

          {
            $sort: {
              totalProducts: -1,
            },
          },

          {
            $limit: 10,
          },

          {
            $project: {

              _id: 0,

              name: "$_id",

              logo: 1,

              totalProducts: 1,

            },
          },

        ]);


      // =========================================
      // 7. CLOTHING DEALS
      // =========================================
      const clothingDeals =
        await SellerInventory.find({

          category: categoryId,

          isActive: true,

          subcategoryName:
            "Clothing",

        }).limit(10);


      // =========================================
      // 8. WINTER WEAR DEALS
      // =========================================
      const winterWearDeals =
        await SellerInventory.find({

          category: categoryId,

          isActive: true,

          subcategoryName:
            "Winter Wear",

        }).limit(10);


      // =========================================
      // 9. ETHNIC WEAR DEALS
      // =========================================
      const ethnicWearDeals =
        await SellerInventory.find({

          category: categoryId,

          isActive: true,

          subcategoryName:
            "Ethnic Wear",

        }).limit(10);


      // =========================================
      // 10. RESPONSE
      // =========================================
      res.status(200).json({

        success: true,

        banner,

        latestLaunches,

        topDeal,

        saleOfDay,

        upcomingDeals,

        topBrands,

        sections: {

          clothingDeals,

          winterWearDeals,

          ethnicWearDeals,

        },

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message,

      });

    }

  };