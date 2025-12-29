const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const SubSub = require('../models/SubSubcategory');

exports.createOrUpdateSubSubcategory = async (req, res) => {
  try {
    const { category: categoryName, subcategory: subName } = req.params;
    const payload = req.body;

    const category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
    if (!category) return res.status(404).json({ error: 'category not found' });
    const sub = await Subcategory.findOne({ name: new RegExp(`^${subName}$`, 'i'), category: category._id });
    if (!sub) return res.status(404).json({ error: 'subcategory not found' });

    const doc = await SubSub.findOneAndUpdate(
      { category: category._id, subcategory: sub._id },
      {
        $set: {
          structure: payload.structure || payload.Categories || {},
          brands: payload.brands || payload.brand || [],
          priceRanges: payload.priceRanges || payload.Price || payload.PriceRanges || [],
          availabilityOptions: payload.availabilityOptions || payload.availabilityOptions || ["In stock","Out of stock"]
        }
      },
      { upsert: true, new: true }
    );

    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubSubcategory = async (req, res) => {
  try {
    const { category: categoryName, subcategory: subName } = req.params;
    const category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
    if (!category) return res.status(404).json({ error: 'category not found' });
    const sub = await Subcategory.findOne({ name: new RegExp(`^${subName}$`, 'i'), category: category._id });
    if (!sub) return res.status(404).json({ error: 'subcategory not found' });

    const doc = await SubSub.findOne({ category: category._id, subcategory: sub._id });
    if (!doc) return res.status(404).json({ error: 'sub-subcategory not found' });

    res.json({
      Categories: doc.structure,
      brand: doc.brands,
      Price: doc.priceRanges,
      availabilityOptions: doc.availabilityOptions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteById = async (req, res) => {
  try {
    await SubSub.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
