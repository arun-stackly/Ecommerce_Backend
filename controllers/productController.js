const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');


const getProducts = asyncHandler(async (req, res) => {
  let query = {};

  const {
    category,
    brand,
    priceRange,
    rating,
    discount,
    payOnDelivery,
    inStock,
    sort,
    page,
    limit,
    search
  } = req.query;

  if (category) query.category = { $in: category.split(',') };
  if (brand) query.brand = { $in: brand.split(',') };

  if (priceRange) {
    const ranges = {
      'under1000': { $lte: 1000 },
      '1000to5000': { $gte: 1000, $lte: 5000 },
      '5000to10000': { $gte: 5000, $lte: 10000 },
      '10000to20000': { $gte: 10000, $lte: 20000 },
      'above20000': { $gte: 20000 }
    };
    if (ranges[priceRange]) query.price = ranges[priceRange];
  }

  if (rating) query.rating = { $gte: Number(rating) };
  if (discount) query.discount = { $gte: Number(discount) };
  if (payOnDelivery === 'true') query.payOnDelivery = true;
  if (inStock === 'true') query.stock = { $gt: 0 };
  if (search) query.name = { $regex: search, $options: 'i' };

  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 12;
  const skip = (pageNumber - 1) * pageSize;

  let sortBy = {};
  if (sort === 'price_low_high') sortBy.price = 1;
  else if (sort === 'price_high_low') sortBy.price = -1;
  else if (sort === 'rating') sortBy.rating = -1;
  else sortBy.createdAt = -1;

  const total = await Product.countDocuments(query);
  const products = await Product.find(query)
    .sort(sortBy)
    .skip(skip)
    .limit(pageSize);

  res.json({
    total,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
    count: products.length,
    filtersUsed: query,
    products
  });
});


const addProduct = asyncHandler(async (req, res) => {
  const { name, brand, category, price, discount, stock, rating, description, image, payOnDelivery } = req.body;

  const product = await Product.create({
    name,
    brand,
    category,
    price,
    discount,
    stock,
    rating,
    description,
    image,
    payOnDelivery
  });

  res.status(201).json({ message: 'Product created successfully', product });
});


const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});


const filterProducts = asyncHandler(async (req, res) => {
  let query = {};

  const {
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    discount,
    inStock,
    sort,
    bestSeller,
    page,
    limit,
    search
  } = req.query;

  if (category) query.category = category;
  if (brand) query.brand = brand;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (rating) query.rating = { $gte: Number(rating) };
  if (discount) query.discount = { $gte: Number(discount) };
  if (inStock === 'true') query.stock = { $gt: 0 };
  if (bestSeller === 'true') query.isBestSeller = true;
  if (search) query.name = { $regex: search, $options: 'i' };

  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 24;
  const skip = (pageNumber - 1) * pageSize;

  let sortBy = {};
  switch (sort) {
    case 'top-rated':
      sortBy = { rating: -1 };
      break;
    case 'price-low-high':
      sortBy = { price: 1 };
      break;
    case 'price-high-low':
      sortBy = { price: -1 };
      break;
    case 'latest':
      sortBy = { createdAt: -1 };
      break;
    default:
      sortBy = { salesCount: -1 };
  }

  const total = await Product.countDocuments(query);
  const products = await Product.find(query).sort(sortBy).skip(skip).limit(pageSize);

  res.json({
    total,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
    count: products.length,
    products
  });
});


const getBrandBestSellers = asyncHandler(async (req, res) => {
  const { category, brand, limit } = req.query;
  let query = {};
  if (category) query.category = category;
  if (brand) query.brand = brand;

  const products = await Product.find(query)
    .sort({ salesCount: -1, rating: -1 })
    .limit(Number(limit) || 10);

  res.json({
    brand,
    category,
    products
  });
});

module.exports = { getProducts, addProduct, getProductById, filterProducts, getBrandBestSellers };
