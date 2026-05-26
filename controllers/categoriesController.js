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

exports.updateCategory = async (
  req,
  res,
) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.body.name) {
      updateData.slug = slugify(
        req.body.name,
      );
    }

    const cat =
      await Category.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true },
      );

    res.json(cat);

  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
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

const SellerInventory =
  require("../models/SellerInventory");

const mongoose =
  require("mongoose");

/* =======================================
   PRICE RANGES API
======================================= */

exports.getPriceRanges =
  async (req, res) => {

    try {

      const { categoryId } =
        req.params;

      const products =
        await SellerInventory.find({

          category:
            new mongoose.Types.ObjectId(
              categoryId
            ),

          isActive: true,

        });

      const ranges = [

        {
          label: "Under ₹1000",
          min: 0,
          max: 1000,
        },

        {
          label: "₹1000 - ₹5000",
          min: 1000,
          max: 5000,
        },

        {
          label: "₹5000 - ₹10000",
          min: 5000,
          max: 10000,
        },

        {
          label: "₹10000 - ₹20000",
          min: 10000,
          max: 20000,
        },

        {
          label: "Over ₹20000",
          min: 20000,
          max: null,
        },

      ];

      const priceRanges =
        ranges.map(range => {

          const count =
            products.filter(product => {

              if (range.max === null) {

                return (
                  product.price >=
                  range.min
                );

              }

              return (

                product.price >=
                  range.min &&

                product.price <
                  range.max

              );

            }).length;

          return {

            ...range,

            count,

          };

        });

      res.status(200).json({

        success: true,

        ranges: priceRanges,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message,

      });

    }

  };

  exports.getProductsByPriceRange =
  async (req, res) => {

    try {

      const { categoryId } =
        req.params;

      const {
        min,
        max
      } = req.query;

      let filter = {

        category:
          new mongoose.Types.ObjectId(
            categoryId
          ),

        isActive: true,

        price: {}

      };

      // MIN PRICE
      if (min) {

        filter.price.$gte =
          Number(min);

      }

      // MAX PRICE
      if (max) {

        filter.price.$lt =
          Number(max);

      }

      const products =
        await SellerInventory.find(
          filter
        )

        .populate(
          "category subcategory"
        )

        .sort({
          price: 1
        });

      res.status(200).json({

        success: true,

        count:
          products.length,

        products,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message,

      });

    }

  };

  exports.getInStockProducts =
  async (req, res) => {

    try {

      const { categoryId } =
        req.params;

      const products =
        await SellerInventory.find({

          category:
            new mongoose.Types.ObjectId(
              categoryId
            ),

          isActive: true,

          quantity: {
            $gt: 0
          }

        })

        .populate(
          "category subcategory"
        )

        .sort({
          createdAt: -1
        });

      res.status(200).json({

        success: true,

        count:
          products.length,

        products,

      });

    } catch (error) {

      res.status(500).json({

        success: false,

        message: error.message,

      });

    }

  };

  exports.getBrandsByCategory = async (req, res) => {

  try {

    const { categoryId } = req.params;

    // GET PRODUCTS
    const products = await SellerInventory.find({

      category: categoryId,
      isActive: true

    }).select("brands");

    // STORE UNIQUE BRANDS
    const brandsMap = new Map();

    products.forEach(product => {

      product.brands?.forEach(brand => {

        if (brandsMap.has(brand.name)) {

          brandsMap.get(brand.name).count += 1;

        } else {

          brandsMap.set(brand.name, {

            name: brand.name,
            logo: brand.logo,
            count: 1

          });

        }

      });

    });

    // FINAL ARRAY
    const brands = Array.from(
      brandsMap.values()
    );

    res.status(200).json({

      success: true,
      totalBrands: brands.length,
      brands

    });

  } catch (error) {

    res.status(500).json({

      success: false,
      message: error.message

    });

  }

};

exports.getProductsByBrand = async (req, res) => {

  try {

    const {
      categoryId,
      brandName
    } = req.params;

    const {
      page = 1,
      limit = 12,
      minPrice,
      maxPrice,
      sort
    } = req.query;

    // FILTER
    let filter = {

      category: categoryId,

      isActive: true,

      "brands.name": brandName

    };

    // PRICE FILTER
    if (minPrice || maxPrice) {

      filter.salePrice = {};

      if (minPrice) {
        filter.salePrice.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.salePrice.$lte = Number(maxPrice);
      }

    }

    // QUERY
    let query = SellerInventory.find(filter)

      .populate("category")
      .populate("subcategory");

    // SORTING
    if (sort === "price-low-high") {

      query = query.sort({
        salePrice: 1
      });

    }

    if (sort === "price-high-low") {

      query = query.sort({
        salePrice: -1
      });

    }

    // PRODUCTS
    const products = await query

      .skip((page - 1) * limit)

      .limit(Number(limit));

    // TOTAL COUNT
    const totalProducts =
      await SellerInventory.countDocuments(filter);

    res.status(200).json({

      success: true,

      brand: brandName,

      totalProducts,

      currentPage: Number(page),

      totalPages: Math.ceil(
        totalProducts / limit
      ),

      products

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message

    });

  }

};