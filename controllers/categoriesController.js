const Category = require('../models/Category');
const slugify = s => s.toLowerCase().replace(/\s+/g, '-');

exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort('name');
    return res.json({ categories: cats.map(c => c.name) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const doc = new Category({ name, slug: slugify(name) });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'category exists' });
    res.status(500).json({ error: err.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
