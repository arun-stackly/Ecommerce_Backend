const mongoose = require('mongoose');

const specificationSchema = new mongoose.Schema({
  modelNumber: String,
  modelName: String,
  color: String,
  simType: String,
  hybridSimSlot: String,
  touchscreen: Boolean,
  otgCompatible: Boolean,
  soundEnhancements: String,
  dimensions: {
    width: String,
    height: String,
    depth: String,
    weight: String,
  },
  warranty: {
    summary: String,
    domesticWarranty: String,
  },
  memoryStorage: {
    internalStorage: String,
    ram: String,
  }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: String,
  category: String,
  price: Number,
  discount: Number,
  stock: Number,
  rating: Number,
  ratingCount: Number,
  description: String,
  image: String,
  payOnDelivery: Boolean,
  salesCount: { type: Number, default: 0 },
  isBestSeller: { type: Boolean, default: false },
  specifications: specificationSchema
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);