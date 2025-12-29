const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: { type: String, required: true },
  brand: {
    type: String,
    enum: [
      'Samsung', 'Oppo', 'Vivo', 'Apple', 'Realme', 'OnePlus', 'Redmi', 'Huawei'
    ],
  },
  category: {
    type: String,
    enum: [
      'Mobile Phones',
      'Accessories',
      'Power Banks',
      'Smartwatches',
      'Chargers & Cables'
    ],
  },
  discountPercent: { type: Number, default: 0 },
  bannerImage: { type: String },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

dealSchema.pre('save', function (next) {
  const now = new Date();
  this.isActive = this.startDate <= now && this.endDate >= now;
  next();
});

module.exports = mongoose.model('Deal', dealSchema);