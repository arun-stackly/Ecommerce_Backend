const Banner = require("../models/Banner");
const Category = require("../models/Category");
const Ad = require("../models/Ad");
const mongoose = require("mongoose");
const Subcategory = require("../models/Subcategory");

exports.getHomePage = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // =========================================
// Hero Banner (Hardcoded)
// =========================================
const heroBanner = {
  badge: "TRAVEL BOOKINGS",
  title: "Your next journey, stacked in one place.",
  subtitle:
    "Flights, hotels, trains, cars and insurance — discover the best deals across trusted brands.",
  primaryButton: {
    text: "Start Booking",
    action: "/travel"
  },
  secondaryButton: {
    text: "Browse Categories",
    action: "/travel/categories"
  },
  images: [
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=500"
  ],
};

    // =========================================
// Browse Travel Categories
// =========================================
const categories = await Subcategory.find({
  category: categoryId,
}).select("name slug")

    // =========================================
// Latest Launches (Hardcoded)
// =========================================
const latestLaunches = [
  {
    id: 1,
    tag: "NEW",
    title: "Maldives Escape",
    destination: "Maldives",
    duration: "3 nights getaway",
    price: "From ₹1299",
    image: "https://example.com/images/maldives.jpg"
  },
  {
    id: 2,
    tag: "TRENDING",
    title: "Tokyo Cherry Blossom",
    destination: "Tokyo, Japan",
    duration: "7 nights experience",
    price: "From ₹1890",
    image: "https://example.com/images/tokyo.jpg"
  },
  {
    id: 3,
    tag: "LIMITED",
    title: "Swiss Alps Rail",
    destination: "Interlaken, Switzerland",
    duration: "6 days package",
    price: "From ₹2150",
    image: "https://example.com/images/swiss.jpg"
  },
  {
    id: 4,
    tag: "HOT",
    title: "Bali Wellness Retreat",
    destination: "Bali, Indonesia",
    duration: "4 nights stay",
    price:"From ₹1050",
    image: "https://example.com/images/bali.jpg"
  }
];

  // =========================================
    // Advertisement Banner (Hardcoded)
    // =========================================
    const advertisementBanner = {
      title: "Flat 20% Off on Holiday Packages",
      subtitle: "Bundle flights, stay and activities together to save more.",
      buttonText: "Grab Deal",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200",
      offer: "20% OFF"
    };

    // =========================================
// Top Brands (Hardcoded)
// =========================================
const topBrands = [
  {
    id: 1,
    name: "Emirates",
    logo: "https://example.com/logos/emirates.png"
  },
  {
    id: 2,
    name: "Marriott",
    logo: "https://example.com/logos/marriott.png"
  },
  {
    id: 3,
    name: "IRCTC",
    logo: "https://example.com/logos/irctc.png"
  },
  {
    id: 4,
    name: "Hertz",
    logo: "https://example.com/logos/hertz.png"
  },
  {
    id: 5,
    name: "Booking",
    logo: "https://example.com/logos/booking.png"
  },
  {
    id: 6,
    name: "Qatar Airways",
    logo: "https://example.com/logos/qatar.png"
  }
];
// =========================================
    // Plan Your Trip (Hardcoded)
    // =========================================
    const planYourTrip = {
      title: "Plan Your Perfect Trip",
      description:
        "Discover flights, hotels, trains, buses and holiday packages—all in one place.",
      rating: 5,
      review:
        "Stackly made planning our family vacation simple and stress-free.",
      buttonText: "Plan Your Trip",
      image:
        "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200"
    };

    // =========================================
    // Response
    // =========================================
    res.status(200).json({
      success: true,
      heroBanner,
      categories,
      latestLaunches,
     advertisementBanner,
      topBrands,
      planYourTrip,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};