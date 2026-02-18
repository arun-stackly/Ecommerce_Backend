require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

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
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const sellerReportRoutes = require("./routes/sellerReportRoutes");
const adRoutes = require("./routes/adRoutes");
const refundRoutes = require("./routes/refundRoutes");
const sellerInventoryRoutes = require("./routes/sellerInventoryRoutes");

const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");

const categoriesRoutes = require("./routes/categories");
const subcategoriesRoutes = require("./routes/subcategories");
const subsubRoutes = require("./routes/subsubcategories");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth/seller", authRoutes);
app.use("/api/auth/seller/password", passwordRoutes);
app.use("/api/auth/user", userAuthRoutes);

app.use("/api/seller", protect, sellerOnly);

app.use("/api/seller/business-info", businessInfoRoutes);
app.use("/api/seller/kyc", kycRoutes);
app.use("/api/seller/bank", bankRoutes);
app.use("/api/seller/dashboard", dashboardRoutes);
app.use("/api/seller/orders", orderRoutes);
app.use("/api/seller/payments", paymentRoutes);
app.use("/api/seller/invoices", invoiceRoutes);
app.use("/api/seller/reports", sellerReportRoutes);
app.use("/api/seller/ads", adRoutes);
app.use("/api/seller/refunds", refundRoutes);
app.use("/api/seller/inventory", sellerInventoryRoutes);

app.use("/api/pincode", pincodeRoutes);

app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);

app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/subsubcategories", subsubRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Merged Ecommerce Backend 🚀",
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
