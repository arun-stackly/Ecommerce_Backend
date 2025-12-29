const asyncHandler = require('express-async-handler');
const Deal = require('../models/Deal');


const addDeal = asyncHandler(async (req, res) => {
  const { title, brand, category, discountPercent, bannerImage, description, startDate, endDate } = req.body;

  const deal = await Deal.create({
    title,
    brand,
    category,
    discountPercent,
    bannerImage,
    description,
    startDate,
    endDate
  });

  res.status(201).json({ message: 'Deal created successfully', deal });
});


const getDeals = asyncHandler(async (req, res) => {
  const { brand, category, status } = req.query;

  let query = {};
  if (brand) query.brand = brand;
  if (category) query.category = category;

  const now = new Date();
  if (status === 'active') query.startDate = { $lte: now }, query.endDate = { $gte: now };
  if (status === 'upcoming') query.startDate = { $gt: now };

  const deals = await Deal.find(query).sort({ startDate: 1 });
  res.json({ count: deals.length, deals });
});


const getDealById = asyncHandler(async (req, res) => {
  const deal = await Deal.findById(req.params.id);
  if (!deal) {
    res.status(404);
    throw new Error('Deal not found');
  }
  res.json(deal);
});

module.exports = { addDeal, getDeals, getDealById };