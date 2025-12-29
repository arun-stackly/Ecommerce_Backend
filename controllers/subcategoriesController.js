const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

const slugify = s => s.toLowerCase().replace(/\s+/g, '-');

exports.createSubcategoriesForCategory = async (req, res) => {
  try {
    const categoryName = req.params.category;
    const list = req.body.subcategories;
    if (!Array.isArray(list)) return res.status(400).json({ error: 'subcategories must be an array' });

    const category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
    if (!category) return res.status(404).json({ error: 'category not found' });

    const results = [];
    for (const name of list) {
      try {
        const doc = new Subcategory({ name, slug: slugify(name), category: category._id });
        await doc.save();
        results.push(name);
      } catch (err) {
        // skip duplicates or errors per item
      }
    }

    res.status(201).json({ category: category.name, subcategories: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubcategoriesForCategory = async (req, res) => {
  try {
    const categoryName = req.params.category;
    const category = await Category.findOne({ name: new RegExp(`^${categoryName}$`, 'i') });
    if (!category) return res.status(404).json({ error: 'category not found' });
    const subs = await Subcategory.find({ category: category._id }).sort('name');
    res.json({ subcategories: subs.map(s => s.name) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSubcategory = async (req, res) => {
  try {
    const sub = await Subcategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(sub);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSubcategory = async (req, res) => {
  try {
    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
