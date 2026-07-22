require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const path = require("path");
 
const { errorHandler } = require("./middleware/errorMiddleware");
const { protect } = require("./middleware/authMiddleware");
const { sellerOnly } = require("./middleware/roleMiddleware");
 
const authRoutes = require("./routes/auth");
const passwordRoutes = require("./routes/password");
const userAuthRoutes = require("./routes/userAuthRoutes");
 
const businessInfoRoutes = require("./routes/businessInfoRoutes");
const pincodeRoutes = require("./routes/pincodeRoutes");
const kycRoutes = require("./routes/kycRoutes");
const bankRoutes = require("./routes/bankRoutes");
 
const dashboardRoutes = require("./routes/dashboardRoutes");
 
const sellerProfileRoutes = require("./routes/sellerProfileRoutes");
const sellerBankRoutes = require("./routes/sellerBankRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const sellerReportRoutes = require("./routes/sellerReportRoutes");
 
const refundRoutes = require("./routes/refundRoutes");
const sellerInventoryRoutes = require("./routes/sellerInventoryRoutes");
 
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
 
const categoriesRoutes = require("./routes/categories");
const subcategoriesRoutes = require("./routes/subcategories");
const subsubRoutes = require("./routes/subsubcategories");
const adsRoutes = require("./routes/adsRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const userorderRoutes = require("./routes/userorderRoutes");
const userlandingRoutes = require("./routes/userlandingRoutes");
const fashionHomeRoutes = require("./routes/fashionHomeRoutes");
const productitemRoutes = require("./routes/productitemRoutes");
const fashionRoutes = require("./routes/Fashion");
const fashionProductDeatailRoutes = require("./routes/FashionProductDetails");
const specificationRoutes = require("./routes/ProductSpecification");
const producttypesRoutes = require("./routes/ProductTypeRoutes");
const ElectronicshomeRoutes = require("./routes/ElectronicshomeRoutes");
const ElectronicsmobileRoutes = require("./routes/ElectronicsRoutes");
const Electronics_ProductDetailsRoutes = require("./routes/ElectronicProductDetails");
const AppliancehomepageRoutes = require("./routes/ApplianceshomepageRoutes");
const ApplianceRoutes = require("./routes/ApplianceRoutes");
const ApplianceProductdetailsRoutes = require("./routes/ApplianceProductdetailRoutes");
const returnRoutes = require("./routes/returnRoutes");
const faqRoutes = require("./routes/faqRoutes");
const contactRoutes = require("./routes/contactRoutes")
 const TravelPackage = require("./routes/travelpackageRouter");
const userBankRoutes = require("./routes/userBankRoutes");
const travelHomeRoutes = require("./routes/travelhomeRoutes");
const travelRoutes = require("./routes/travelRoutes");
const dns = require("dns");
 
dns.setServers(["8.8.8.8", "8.8.4.4"]);
 
const app = express();
 
connectDB();
 
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
 
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/product-types", require("./routes/ProductTypeRoutes"));
app.use("/api/productitems", productitemRoutes);
app.use("/api/productspecs", specificationRoutes);
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use("/api/deals", require("./routes/dealRoutes"));
app.use("/api/banners", require("./routes/bannerRoutes"));
app.use("/api/home", require("./routes/ElectronicshomeRoutes"));
app.use(
  "/api",
  require("./routes/ElectronicsRoutes"),
);


app.use(
  "/api/specification-templates",
  require("./routes/specificationTemplateRoutes")
);
app.use("/api/electronics/productdetails", Electronics_ProductDetailsRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/home", AppliancehomepageRoutes);
app.use("/api", ApplianceRoutes);
app.use("/api/productdetails", ApplianceProductdetailsRoutes);
 
app.use("/api/ads", adsRoutes);
app.use("/api/user/wishlist", wishlistRoutes);
app.use("/api/auth/seller", authRoutes);
app.use("/api/auth/seller/password", passwordRoutes);
app.use("/api/auth/user", userAuthRoutes);
app.use("/api/home", fashionHomeRoutes);
app.use("/api", fashionRoutes);
app.use("/api/productdetails", fashionProductDeatailRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/user/orders", userorderRoutes);
app.use("/api/faq", faqRoutes);
app.use("/api/contact", contactRoutes);
 
app.use("/api/seller", protect, sellerOnly);
 
app.use("/api/seller/business-info", businessInfoRoutes);
app.use("/api/seller/kyc", kycRoutes);
app.use("/api/seller/bank", bankRoutes);
app.use("/api/seller/dashboard", dashboardRoutes);
app.use("/api/seller/profile", sellerProfileRoutes);
app.use("/api/seller/business-profile", require("./routes/businessProfileRoutes"));
app.use("/api/seller/bank-details", sellerBankRoutes);
app.use("/api/seller/invoices", invoiceRoutes);
app.use("/api/seller/reports", sellerReportRoutes);
 
app.use("/api/refunds", refundRoutes);
app.use("/api/seller/inventory", sellerInventoryRoutes);
app.use("/api/seller-settings", require("./routes/sellerSettingsRoutes"));
 
app.use("/api/user/pincode", pincodeRoutes);
 
app.use("/api/user/cart", cartRoutes);
app.use("/api/user/address", addressRoutes);
app.use("/api/user/payment", paymentRoutes);
 
app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/subsubcategories", subsubRoutes);
app.use("/api/user/bank", userBankRoutes);
app.use("/api/user", userlandingRoutes);
app.use("/api/travelpackage", TravelPackage);
app.use("/api/travel/home", travelHomeRoutes);
 app .use("/api/travel", travelRoutes);
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Merged Ecommerce Backend 🚀",
  });
});
 
app.use(errorHandler);
 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
console.log("MONGO_URI:", process.env.MONGO_URI);
 
 