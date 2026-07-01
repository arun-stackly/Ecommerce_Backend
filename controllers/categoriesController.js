const Category = require('../models/Category');
const slugify = s => s.toLowerCase().replace(/\s+/g, '-');

exports.getCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort("name");

    return res.status(200).json({
      success: true,
      count: cats.length,
      categories: cats,
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      error: err.message,
    });

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

 exports.getProductsByPriceRange = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const { min, max } = req.query;

    let filter = {
      category: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
      price: {},
    };

    // ==========================
    // MIN PRICE
    // ==========================
    if (min) {
      filter.price.$gte = Number(min);
    }

    // ==========================
    // MAX PRICE
    // ==========================
    if (max) {
      filter.price.$lte = Number(max);
    }

    // ==========================
    // QUERY (LIMIT FIELDS)
    // ==========================
    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media")
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ price: 1 });

    // ==========================
    // FORMAT RESPONSE
    // ==========================
    const formattedProducts = products.map((p) => {
      const originalPrice = p.price;
      const finalPrice = p.discountPrice || p.price;

      return {
        _id: p._id,
        name: p.name,

        price: originalPrice,        // MRP (strikethrough)
        discountPrice: finalPrice,   // selling price

        brand: p.brand?.name || null,
        logo: p.brand?.logo || null,

        image: p.media?.[0]?.url || null,
      };
    });

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 exports.getInStockProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const products = await SellerInventory.find({
      category: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
      quantity: { $gt: 0 },
    })
      .select("name price discountPrice brand media")
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ createdAt: -1 });

    // ==========================
    // FORMAT RESPONSE
    // ==========================
    const formattedProducts = products.map((p) => {
      const originalPrice = p.price;
      const finalPrice = p.discountPrice || p.price;

      return {
        _id: p._id,
        name: p.name,

        price: originalPrice,
        discountPrice: finalPrice,

        brand: p.brand?.name || null,
        logo: p.brand?.logo || null,

        image: p.media?.[0]?.url || null,

        inStock: p.quantity > 0, // optional but useful
      };
    });

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
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

    const products = await SellerInventory.find({
      category: categoryId,
      isActive: true,
    }).select("brand");

    const brandsMap = new Map();

    products.forEach((product) => {
      const brand = product.brand;

      if (!brand?.name) return;

      if (brandsMap.has(brand.name)) {
        brandsMap.get(brand.name).count += 1;
      } else {
        brandsMap.set(brand.name, {
          name: brand.name,
          logo: brand.logo || null,
          count: 1,
        });
      }
    });

    const brands = Array.from(brandsMap.values());

    res.status(200).json({
      success: true,
      totalBrands: brands.length,
      brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getProductsByBrand = async (req, res) => {
  try {
    const { categoryId, brandName } = req.params;

    const {
      page = 1,
      limit = 12,
      minPrice,
      maxPrice,
      sort,
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    // ==========================
    // FILTER
    // ==========================
    let filter = {
      category: categoryId,
      isActive: true,
      "brand.name": {
        $regex: new RegExp(`^${brandName}$`, "i"),
      },
    };

    // ==========================
    // PRICE FILTER
    // ==========================
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ==========================
    // QUERY (LIMIT FIELDS)
    // ==========================
    let query = SellerInventory.find(filter)
      .select("name price brand media discountPrice") // ✅ ONLY REQUIRED FIELDS
      .populate("category", "name")
      .populate("subcategory", "name");

    // ==========================
    // SORT
    // ==========================
    if (sort === "price-low-high") {
      query = query.sort({ price: 1 });
    }

    if (sort === "price-high-low") {
      query = query.sort({ price: -1 });
    }

    // ==========================
    // PAGINATION
    // ==========================
    const products = await query
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    // ==========================
    // FORMAT RESPONSE (clean UI)
    // ==========================
    const formattedProducts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice, // ✅ ADDED HERE
      brand: p.brand?.name || null,
      logo: p.brand?.logo || null,
      image: p.media?.[0]?.url || null, // ✅ first image only
    }));

    const totalProducts = await SellerInventory.countDocuments(filter);

    res.status(200).json({
      success: true,
      brand: brandName,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getProductsByBrandAndSubcategory = async (req, res) => {
    console.log("SUBCATEGORY API CALLED");
  try {
    const { subcategoryId, brandName } = req.params;

    console.log("subcategoryId:", subcategoryId);
    console.log("brandName:", brandName);

    const filter = {
      subcategory: subcategoryId,
      isActive: true,
      "brand.name": {
        $regex: new RegExp(`^${brandName}$`, "i"),
      },
    };

    console.log("Filter:", filter);

    const count = await SellerInventory.countDocuments(filter);
    console.log("Matching Products:", count);

    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media");

    return res.status(200).json({
      success: true,
      brand: brandName,
      totalProducts: products.length,
      products,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
  exports.getProductsByBrandAndSubSubcategory =
  async (req, res) => {
    try {
      const {
        subSubcategoryId,
        brandName,
      } = req.params;

      const filter = {
        subSubcategory:
          subSubcategoryId,
        isActive: true,
        "brand.name": {
          $regex: new RegExp(
            `^${brandName}$`,
            "i"
          ),
        },
      };

      const products =
        await SellerInventory.find(filter)
          .select(
            "name price discountPrice brand media"
          );

      res.status(200).json({
        success: true,
        brand: brandName,
        totalProducts:
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
  exports.getProductsByBrandAndProductType =
  async (req, res) => {
    try {
      const {
        productTypeId,
        brandName,
      } = req.params;

      const filter = {
        productType: productTypeId,
        isActive: true,
        "brand.name": {
          $regex: new RegExp(
            `^${brandName}$`,
            "i"
          ),
        },
      };

      const products =
        await SellerInventory.find(filter)
          .select(
            "name price discountPrice brand media"
          );

      res.status(200).json({
        success: true,
        brand: brandName,
        totalProducts:
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
  exports.getProductsByPriceRangeAndSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { min, max } = req.query;

    let filter = {
      subcategory: new mongoose.Types.ObjectId(subcategoryId),
      isActive: true,
      price: {},
    };

    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);

    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media")
      .sort({ price: 1 });

    const formattedProducts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice || p.price,
      brand: p.brand?.name || null,
      logo: p.brand?.logo || null,
      image: p.media?.[0]?.url || null,
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getProductsByPriceRangeAndSubSubcategory = async (req, res) => {
  try {
    const { subSubcategoryId } = req.params;
    const { min, max } = req.query;

    let filter = {
      subSubcategory: new mongoose.Types.ObjectId(subSubcategoryId),
      isActive: true,
      price: {},
    };

    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);

    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media")
      .sort({ price: 1 });

    const formattedProducts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice || p.price,
      brand: p.brand?.name || null,
      logo: p.brand?.logo || null,
      image: p.media?.[0]?.url || null,
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getProductsByPriceRangeAndProductType = async (req, res) => {
  try {
    const { productTypeId } = req.params;
    const { min, max } = req.query;

    let filter = {
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
      price: {},
    };

    if (min) filter.price.$gte = Number(min);
    if (max) filter.price.$lte = Number(max);

    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media")
      .sort({ price: 1 });

    const formattedProducts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice || p.price,
      brand: p.brand?.name || null,
      logo: p.brand?.logo || null,
      image: p.media?.[0]?.url || null,
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getInStockProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;

    const products = await SellerInventory.find({
      subcategory: new mongoose.Types.ObjectId(subcategoryId),
      isActive: true,
      quantity: { $gt: 0 },
    }).select("name price discountPrice brand media");

    const formattedProducts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice || p.price,
      brand: p.brand?.name || null,
      logo: p.brand?.logo || null,
      image: p.media?.[0]?.url || null,
      inStock: true,
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getInStockProductsBySubSubcategory = async (req, res) => {
  try {
    const { subSubcategoryId } = req.params;

    const products = await SellerInventory.find({
      subSubcategory: new mongoose.Types.ObjectId(subSubcategoryId),
      isActive: true,
      quantity: { $gt: 0 },
    }).select("name price discountPrice brand media");

    const formattedProducts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice || p.price,
      brand: p.brand?.name || null,
      logo: p.brand?.logo || null,
      image: p.media?.[0]?.url || null,
      inStock: true,
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.getInStockProductsByProductType = async (req, res) => {
  try {
    const { productTypeId } = req.params;

    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
      isActive: true,
      quantity: { $gt: 0 },
    }).select("name price discountPrice brand media");

    const formattedProducts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      discountPrice: p.discountPrice || p.price,
      brand: p.brand?.name || null,
      logo: p.brand?.logo || null,
      image: p.media?.[0]?.url || null,
      inStock: true,
    }));

    res.status(200).json({
      success: true,
      count: formattedProducts.length,
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};