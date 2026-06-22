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
const ElectronicsmobilehomeRoutes = require("./routes/Electronics_MobilePhone_Home");
const ElectronicsbestsellerRoutes = require("./routes/Electronics_bestseller_MobileRoutes");
const ElectronicstopratedRoutes = require("./routes/Electronics_TopRatedRoutes");
const Electronics_ProductDetailsRoutes = require("./routes/ElectronicProductDetails");
const Elecronics_specificationRoutes = require("./routes/Elecronics_SpecificationRoutes");
const Electronics_Cases_HomepageRoutes = require("./routes/Electronics_Cases_Home");
const AppliancehomepageRoutes = require("./routes/ApplianceshomepageRoutes");
const ApplianceRoutes = require("./routes/ApplianceRoutes");
const ApplianceProductdetailsRoutes = require("./routes/ApplianceProductdetailRoutes");
const returnRoutes = require("./routes/returnRoutes");
 
const userBankRoutes = require("./routes/userBankRoutes");
 
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
app.use("/api/electronics", require("./routes/ElectronicshomeRoutes"));
app.use(
  "/api/electronics/mobilehome",
  require("./routes/Electronics_MobilePhone_Home"),
);
app.use(
  "/api/electronics/bestseller/mobile",
  require("./routes/Electronics_bestseller_MobileRoutes"),
);
app.use(
  "/api/electronics/toprated",
  require("./routes/Electronics_TopRatedRoutes"),
);
app.use("/api/electronics/productdetails", Electronics_ProductDetailsRoutes);
app.use("/api/elctronics/specifications", Elecronics_specificationRoutes);
app.use("/api/cases/home", Electronics_Cases_HomepageRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/appliance/homepage", AppliancehomepageRoutes);
app.use("/api/appliance", ApplianceRoutes);
app.use("/api/appliance/productdetails", ApplianceProductdetailsRoutes);
 
app.use("/api/ads", adsRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/auth/seller", authRoutes);
app.use("/api/auth/seller/password", passwordRoutes);
app.use("/api/auth/user", userAuthRoutes);
app.use("/api/fashion", fashionHomeRoutes);
app.use("/api/fashions", fashionRoutes);
app.use("/api/productdetails", fashionProductDeatailRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/orders", userorderRoutes);
 
app.use("/api/seller", protect, sellerOnly);
 
app.use("/api/seller/business-info", businessInfoRoutes);
app.use("/api/seller/kyc", kycRoutes);
app.use("/api/seller/bank", bankRoutes);
app.use("/api/seller/dashboard", dashboardRoutes);
app.use("/api/seller/profile", sellerProfileRoutes);
app.use("/api/business-profile", require("./routes/businessProfileRoutes"));
app.use("/api/seller/bank-details", sellerBankRoutes);
app.use("/api/seller/invoices", invoiceRoutes);
app.use("/api/seller/reports", sellerReportRoutes);
 
app.use("/api/refunds", refundRoutes);
app.use("/api/seller/inventory", sellerInventoryRoutes);
app.use("/api/seller-settings", require("./routes/sellerSettingsRoutes"));
 
app.use("/api/pincode", pincodeRoutes);
 
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/payment", paymentRoutes);
 
app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/subsubcategories", subsubRoutes);
 
app.use("/api/user", userlandingRoutes);
 
app.use("/api/user/bank", userBankRoutes);
 
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
 
 