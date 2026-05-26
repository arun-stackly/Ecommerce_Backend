const Invoice = require("../models/Invoice");

/* ================= GENERATE INVOICE ================= */
exports.generateInvoice = async (req, res) => {
  const invoice = await Invoice.create({
    sellerId: req.user._id, // from JWT
    orderId: req.body.orderId,
    invoiceNumber: req.body.invoiceNumber,
    totalAmount: req.body.totalAmount,
  });

  res.status(201).json(invoice);
};

/* ================= GET SELLER INVOICES ================= */
exports.getInvoices = async (req, res) => {
  const invoices = await Invoice.find({
    sellerId: req.user._id,
  }).sort({ createdAt: -1 });

  res.json(invoices);
};
