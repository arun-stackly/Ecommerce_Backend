const mongoose = require('mongoose');

const SubSubcategorySchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', required: true },
  structure: { type: mongoose.Schema.Types.Mixed, default: {} },
  brands: { type: [mongoose.Schema.Types.Mixed], default: [] },
  priceRanges: { type: [String], default: [] },
  availabilityOptions: { type: [String], default: [] }
}, { timestamps: true });

SubSubcategorySchema.index({ category: 1, subcategory: 1 }, { unique: true });

module.exports = mongoose.model('SubSubcategory', SubSubcategorySchema);
