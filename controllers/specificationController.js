const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

const getSpecifications = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).select('name brand category specifications');
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product.specifications);
});


const filterBySpecifications = asyncHandler(async (req, res) => {
  const { color, internalStorage, simType, hybridSimSlot, brand, ram } = req.query;
  let query = {};

  if (brand) query.brand = brand;
  if (color) query['specifications.color'] = color;
  if (internalStorage) query['specifications.memoryStorage.internalStorage'] = internalStorage;
  if (simType) query['specifications.simType'] = simType;
  if (hybridSimSlot) query['specifications.hybridSimSlot'] = hybridSimSlot;
  if (ram) query['specifications.memoryStorage.ram'] = ram;

  const products = await Product.find(query).limit(50);
  res.json({
    count: products.length,
    filtersUsed: query,
    products
  });
});

module.exports = { getSpecifications, filterBySpecifications };