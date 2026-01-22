require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");

// routes
const authRoutes = require("./routes/auth");
const businessInfoRoutes = require("./routes/businessInfoRoutes");
const pincodeRoutes = require("./routes/pincodeRoutes");
const kycRoutes = require("./routes/kycRoutes");
const bankRoutes = require("./routes/bankRoutes");
const passwordRoutes = require("./routes/password");

const productRoutes = require("./routes/product");
const productFilterRoutes = require("./routes/productFilter");
const productDetailRoutes = require("./routes/productDetail");
const specificationRoutes = require("./routes/specification");
const dealRoutes = require("./routes/deal");
const bestsellerRoutes = require("./routes/bestseller");

const categoriesRoutes = require("./routes/categories");
const subcategoriesRoutes = require("./routes/subcategories");
const subsubRoutes = require("./routes/subsubcategories");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// mount routes
app.use("/api/auth", authRoutes);
app.use("/api/seller/business-info", businessInfoRoutes);
app.use("/api/pincode", pincodeRoutes);
app.use("/api/seller/kyc", kycRoutes);
app.use("/api/seller/bank", bankRoutes);
app.use("/api/auth/password", passwordRoutes);

app.use("/api/seller/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/seller/orders", require("./routes/orderRoutes"));
app.use("/api/seller/payments", require("./routes/paymentRoutes"));
app.use("/api/seller/invoices", require("./routes/invoiceRoutes"));
app.use("/api/seller", require("./routes/sellerReportRoutes"));
app.use("/api/seller/ads", require("./routes/adRoutes"));
app.use("/api/seller/refunds", require("./routes/refundRoutes"));
app.use("/api/seller/inventory", require("./routes/sellerInventoryRoutes"));

app.use("/api/products", productRoutes);
app.use("/api/products", productFilterRoutes);
app.use("/api/products", productDetailRoutes);
app.use("/api/specifications", specificationRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/bestseller", bestsellerRoutes);

// categories
app.use("/api/categories", categoriesRoutes);
app.use("/api/subcategories", subcategoriesRoutes);
app.use("/api/subsubcategories", subsubRoutes);

app.get("/", (req, res) =>
  res.json({ status: "ok", message: "Merged Ecommerce Backend" }),
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

const { errorHandler } = require("./middleware/errorMiddleware");

app.use(errorHandler);
