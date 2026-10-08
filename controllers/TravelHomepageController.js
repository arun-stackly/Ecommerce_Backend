const Banner = require("../models/Banner");
const Category = require("../models/Category");
const Ad = require("../models/Ad");
const mongoose = require("mongoose");
const Subcategory = require("../models/Subcategory");
 
const { getS3SignedUrl } = require("../utils/s3Helper");
 
/* =========================================
   S3 SIGNED URL HELPER
========================================= */
 
const getSignedUrl = async (value) => {
  if (!value) return "";
 
  /* =========================================
     BASE64 IMAGE
  ========================================= */
 
  if (typeof value === "string" && value.startsWith("data:")) {
    return value;
  }
 
  let key = value;
 
  /* =========================================
     FULL URL
     Example:
     https://example.com/images/Tokyo.jpg
 
     Convert to:
     Tokyo.jpg
  ========================================= */
 
  if (
    typeof value === "string" &&
    (value.startsWith("http://") || value.startsWith("https://"))
  ) {
    try {
      const url = new URL(value);
 
      let pathname = decodeURIComponent(url.pathname);
 
      // Remove leading /
      pathname = pathname.replace(/^\/+/, "");
 
      // Get only filename
      key = pathname.split("/").pop();
    } catch (error) {
      console.error("Invalid Image URL:", value, error.message);
 
      return "";
    }
  }
 
  /* =========================================
     GET S3 SIGNED URL
  ========================================= */
 
  try {
    return await getS3SignedUrl(key);
  } catch (error) {
    console.error("S3 Signed URL Error:", key, error.message);
 
    return "";
  }
};
 
/* =========================================
   TRAVEL HOMEPAGE
========================================= */
 
exports.getHomePage = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    /* =========================================
       HERO BANNER
    ========================================= */
 
    const heroBanner = {
      badge: "TRAVEL BOOKINGS",
 
      title: "Your next journey, stacked in one place.",
 
      subtitle:
        "Flights, hotels, trains, cars and insurance — discover the best deals across trusted brands.",
 
      primaryButton: {
        text: "Start Booking",
        action: "/travel",
      },
 
      secondaryButton: {
        text: "Browse Categories",
        action: "/travel/categories",
      },
 
      images: await Promise.all([
        getSignedUrl("hero-banner-1.jpg"),
        getSignedUrl("hero-banner-2.jpg"),
        getSignedUrl("hero-banner-3.jpg"),
      ]),
    };
 
    /* =========================================
       BROWSE TRAVEL CATEGORIES
    ========================================= */
 
    const categories = await Subcategory.find({
      category: categoryId,
    }).select("name slug");
 
    /* =========================================
       LATEST LAUNCHES
    ========================================= */
 
    const latestLaunches = await Promise.all([
      {
        id: 1,
        subcategory: "HolidayPackages",
        tag: "NEW",
        title: "Maldives Escape",
        destination: "Maldives",
        duration: "3 nights getaway",
        price: "From ₹1299",
        image: await getSignedUrl("Maldives.jpg"),
      },
 
      {
        id: 2,
        subcategory: "Flights",
        tag: "TRENDING",
        title: "Tokyo Flight Deals",
        destination: "Tokyo, Japan",
        duration: "Round trip",
        price: "From ₹1890",
        image: await getSignedUrl("Tokyo.jpg"),
      },
 
      {
        id: 3,
        subcategory: "TrainBooking",
        tag: "LIMITED",
        title: "Swiss Alps Rail",
        destination: "Interlaken, Switzerland",
        duration: "6 days package",
        price: "From ₹2150",
        image: await getSignedUrl("swiss-alps-rail.jpg"),
      },
 
      {
        id: 4,
        subcategory: "Hotels",
        tag: "HOT",
        title: "Bali Wellness Retreat",
        destination: "Bali, Indonesia",
        duration: "4 nights stay",
        price: "From ₹1050",
        image: await getSignedUrl("bali.jpg"),
      },
    ]);
 
    /* =========================================
       ADVERTISEMENT BANNER
    ========================================= */
 
    const advertisementBanner = {
      title: "Flat 20% Off on Holiday Packages",
 
      subtitle: "Bundle flights, stay and activities together to save more.",
 
      buttonText: "Grab Deal",
 
      image: await getSignedUrl("holiday-banner.jpg"),
 
      offer: "20% OFF",
    };
 
    /* =========================================
       TOP BRANDS
    ========================================= */
 
    const topBrands = await Promise.all([
      {
        id: 1,
        name: "Emirates",
        logo: await getSignedUrl("emirates.png"),
      },
 
      {
        id: 2,
        name: "Marriott",
        logo: await getSignedUrl("marriott.png"),
      },
 
      {
        id: 3,
        name: "IRCTC",
        logo: await getSignedUrl("irctc.png"),
      },
 
      {
        id: 4,
        name: "Hertz",
        logo: await getSignedUrl("hertz.png"),
      },
 
      {
        id: 5,
        name: "Booking",
        logo: await getSignedUrl("booking.png"),
      },
 
      {
        id: 6,
        name: "Qatar Airways",
        logo: await getSignedUrl("qatar.png"),
      },
    ]);
 
    /* =========================================
       PLAN YOUR TRIP
    ========================================= */
 
    const planYourTrip = {
      title: "Plan Your Perfect Trip",
 
      description:
        "Discover flights, hotels, trains, buses and holiday packages—all in one place.",
 
      rating: 5,
 
      review:
        "Stackly made planning our family vacation simple and stress-free.",
 
      buttonText: "Plan Your Trip",
 
      image: await getSignedUrl("plan-your-trip.jpg"),
    };
 
    /* =========================================
       RESPONSE
    ========================================= */
 
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
    console.error("Travel Homepage Error:", error);
 
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 