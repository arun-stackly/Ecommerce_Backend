const SellerInventory = require("../models/SellerInventory");

// =========================================
// Recently Added Products
// =========================================
exports.getRecentlyAddedProducts = async (req, res) => {
  try {
    const products = await SellerInventory.find({
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(3);

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// Fashion Home Page
// =========================================
exports.getFashionHomePage = async (req, res) => {
  try {
    const data = {
      heroBanner: {
        smallTitle:
          "Your go-to store for fashion and innovation.",

        title:
          "Experience Innovation & Style Every Day",

        description:
          "Explore top electronics and the latest fashion all in one place, curated for performance, comfort, and everyday living.",

        button: {
          text: "Shop Now",
          route: "/fashion",
        },

        images: [
          "https://i.pinimg.com/originals/98/6c/16/986c16defcb240fce7ffe9c8973b4738.jpg",
          "https://mir-s3-cdn-cf.behance.net/projects/404/ca8228125688271.Y3JvcCw0MjYxLDMzMzMsMzY5LDA.png",
          "https://www.idslogic.co.uk/wp-content/uploads/2024/09/e-commerce-platfoms-for-fasion-industry.jpg",
        ],
      },
    };

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// Featured Deals
// =========================================
exports.getFeaturedDeals = async (req, res) => {
  try {
    const featuredDeals = {
      title: "Featured Deals",

      deals: [
        {
          id: 1,
          badge: "Limited Time Offer",
          title: "Upto 30% Off For The Earbuds",

          button: {
            text: "Shop Now",
            route: "/electronics",
          },

          image: "https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcRshbS5ycS5lGnwmilIq_sZPqMUgxfVTN33vvfdOA3iGSpRdcqa",
          position: "left-top",
        },

        {
          id: 2,
          badge: "Special Deal",
          title: "Upto 10% Off For The First Buying!",

          button: {
            text: "Shop Now",
            route: "/fashion",
          },

          image: "https://static.vecteezy.com/system/resources/thumbnails/002/086/009/small/headphones-on-white-background-free-photo.jpg",
          position: "right",
        },

        {
          id: 3,
          badge: "Big Deal",
          title: "Upto 60% Off For The Accessories!",

          button: {
            text: "Shop Now",
            route: "/accessories",
          },

          image: "https://t4.ftcdn.net/jpg/06/60/68/37/360_F_660683718_qo0q1V2RuLO56S7cu4VMb078m10U6WW8.jpg",
          position: "left-bottom",
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: featuredDeals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =========================================
// Product Image Gallery
// =========================================
exports.getProductImageGallery = async (req, res) => {
  try {
    const products = await SellerInventory.find({
      isActive: true,
    })
      .select("name media")
      .sort({ createdAt: -1 });

    const productImages = [];

    products.forEach((product) => {
      if (product.media && product.media.length > 0) {
        productImages.push({
          productId: product._id,
          productName: product.name,
          image: product.media[0],
        });
      }
    });

    res.status(200).json({
      success: true,
      count: productImages.length,
      data: productImages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};