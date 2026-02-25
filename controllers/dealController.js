const Deal = require("../models/Deal");
const Product = require("../models/Product");


// ✅ Add Deal
exports.addDeal = async (req, res) => {
  try {
    const { productId } = req.body;

    // check product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const deal = new Deal(req.body);
    await deal.save();

    res.status(201).json({
      message: "Deal added successfully",
      deal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Get All Deals
exports.getAllDeals = async (req, res) => {
  try {
    const deals = await Deal.find().populate("productId");
    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Get Single Deal
exports.getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id).populate("productId");

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Update Deal
exports.updateDeal = async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.json({
      message: "Deal updated successfully",
      deal,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Delete Deal
exports.deleteDeal = async (req, res) => {
  try {
    const deal = await Deal.findByIdAndDelete(req.params.id);

    if (!deal) {
      return res.status(404).json({ message: "Deal not found" });
    }

    res.json({ message: "Deal deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Top Weekly Deal
exports.getTopWeekDeal = async (req, res) => {
  try {
    const deal = await Deal.findOne({
      type: "weekly",
      isActive: true,
    }).populate("productId");

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ Upcoming Deals
exports.getUpcomingDeals = async (req, res) => {
  try {
    const deals = await Deal.find({
      type: "upcoming",
      isActive: true,
    }).populate("productId");

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ✅ Get Deals By Brand (Samsung / Oppo / Vivo)
exports.getDealsByBrand = async (req, res) => {
  try {
    const { brand } = req.params;

    const deals = await Deal.find({ isActive: true })
      .populate({
        path: "productId",
        match: { brand: brand }
      });

    // Remove deals where product didn't match brand
    const filteredDeals = deals.filter(deal => deal.productId !== null);

    res.json(filteredDeals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};