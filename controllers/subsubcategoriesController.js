const SubSubcategory = require("../models/SubSubcategory");
const Category = require("../models/Category");
const Subcategory = require("../models/Subcategory");

// CREATE SUBSUBCATEGORY
exports.createSubSubcategory = async (req, res) => {
  try {

    const { name, categoryId, subcategoryId } = req.body;

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const category = await Category.findById(categoryId);
    const subcategory = await Subcategory.findById(subcategoryId);

    if (!category || !subcategory) {
      return res.status(404).json({
        message: "Category or Subcategory not found"
      });
    }

    const subSub = new SubSubcategory({
      name,
      slug,
      category: categoryId,
      subcategory: subcategoryId
    });

    await subSub.save();

    res.status(201).json({
      success: true,
      data: subSub
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getSubSubcategories = async (req, res) => {
  try {

    const data = await SubSubcategory.find()
      .populate("category")
      .populate("subcategory");

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getBySubcategory = async (req, res) => {

  try {

    const data = await SubSubcategory.find({
      subcategory: req.params.subcategoryId
    });

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};
exports.updateSubSubcategory = async (req, res) => {

  try {

    const updated = await SubSubcategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};
exports.deleteSubSubcategory = async (req, res) => {

  try {

    await SubSubcategory.findByIdAndDelete(req.params.id);

    res.json({
      message: "SubSubcategory deleted"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

};