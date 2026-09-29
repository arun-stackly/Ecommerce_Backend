const Category = require("../models/Category");
const SellerInventory = require("../models/SellerInventory");
const mongoose = require("mongoose");
 
const { getS3SignedUrl } = require("../utils/s3Helper");
 
/* =========================================================
   SLUG
========================================================= */
 
const slugify = (s) => s.toLowerCase().trim().replace(/\s+/g, "-");
 
/* =========================================================
   S3 SIGNED URL HELPERS
========================================================= */
 
// Get signed URL safely
const getSignedUrl = async (value) => {
  if (!value) return null;
 
  try {
    return await getS3SignedUrl(value);
  } catch (error) {
    console.error("S3 Signed URL Error:", error.message);
    return null;
  }
};
 
// Get first product image
const getFirstImage = async (media) => {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }
 
  return await getSignedUrl(media[0]?.url);
};
 
// Convert all product media URLs
const getSignedMedia = async (media) => {
  if (!Array.isArray(media)) {
    return [];
  }
 
  return await Promise.all(
    media.map(async (item) => ({
      ...(item.toObject ? item.toObject() : item),
      url: await getSignedUrl(item?.url),
    })),
  );
};
 
/* =========================================================
   GET CATEGORIES
========================================================= */
 
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
 
/* =========================================================
   CREATE CATEGORY
========================================================= */
 
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
 
    if (!name) {
      return res.status(400).json({
        error: "name required",
      });
    }
 
    const doc = new Category({
      name,
      slug: slugify(name),
    });
 
    await doc.save();
 
    res.status(201).json(doc);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: "category exists",
      });
    }
 
    res.status(500).json({
      error: err.message,
    });
  }
};
 
/* =========================================================
   UPDATE CATEGORY
========================================================= */
 
exports.updateCategory = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };
 
    if (req.body.name) {
      updateData.slug = slugify(req.body.name);
    }
 
    const cat = await Category.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
 
    res.json(cat);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
 
/* =========================================================
   DELETE CATEGORY
========================================================= */
 
exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
 
    res.json({
      ok: true,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
};
 
/* =========================================================
   PRICE RANGES
========================================================= */
 
exports.getPriceRanges = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    const products = await SellerInventory.find({
      category: new mongoose.Types.ObjectId(categoryId),
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
 
    const priceRanges = ranges.map((range) => {
      const count = products.filter((product) => {
        if (range.max === null) {
          return product.price >= range.min;
        }
 
        return product.price >= range.min && product.price < range.max;
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
 
/* =========================================================
   PRODUCTS BY PRICE RANGE
========================================================= */
 
exports.getProductsByPriceRange = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { min, max } = req.query;
 
    const filter = {
      category: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
      price: {},
    };
 
    if (min) {
      filter.price.$gte = Number(min);
    }
 
    if (max) {
      filter.price.$lte = Number(max);
    }
 
    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media")
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({ price: 1 });
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice || p.price,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
      })),
    );
 
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
 
/* =========================================================
   IN-STOCK PRODUCTS
========================================================= */
 
exports.getInStockProducts = async (req, res) => {
  try {
    const { categoryId } = req.params;
 
    const products = await SellerInventory.find({
      category: new mongoose.Types.ObjectId(categoryId),
      isActive: true,
      quantity: {
        $gt: 0,
      },
    })
      .select("name price discountPrice brand media")
      .populate("category", "name")
      .populate("subcategory", "name")
      .sort({
        createdAt: -1,
      });
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice || p.price,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
 
        inStock: p.quantity > 0,
      })),
    );
 
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
 
/* =========================================================
   BRANDS BY CATEGORY
========================================================= */
 
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
 
      if (!brand?.name) {
        return;
      }
 
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
 
    const brands = await Promise.all(
      Array.from(brandsMap.values()).map(async (brand) => ({
        name: brand.name,
        logo: await getSignedUrl(brand.logo),
        count: brand.count,
      })),
    );
 
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
 
/* =========================================================
   PRODUCTS BY BRAND
========================================================= */
 
exports.getProductsByBrand = async (req, res) => {
  try {
    const { categoryId, brandName } = req.params;
 
    const { page = 1, limit = 12, minPrice, maxPrice, sort } = req.query;
 
    const pageNum = Number(page);
    const limitNum = Number(limit);
 
    const filter = {
      category: categoryId,
      isActive: true,
 
      "brand.name": {
        $regex: new RegExp(`^${brandName}$`, "i"),
      },
    };
 
    if (minPrice || maxPrice) {
      filter.price = {};
 
      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }
 
      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }
 
    let query = SellerInventory.find(filter)
      .select("name price brand media discountPrice")
      .populate("category", "name")
      .populate("subcategory", "name");
 
    if (sort === "price-low-high") {
      query = query.sort({
        price: 1,
      });
    }
 
    if (sort === "price-high-low") {
      query = query.sort({
        price: -1,
      });
    }
 
    const products = await query.skip((pageNum - 1) * limitNum).limit(limitNum);
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
      })),
    );
 
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
 
/* =========================================================
   PRODUCTS BY BRAND + SUBCATEGORY
========================================================= */
 
exports.getProductsByBrandAndSubcategory = async (req, res) => {
  try {
    const { subcategoryId, brandName } = req.params;
 
    const filter = {
      subcategory: subcategoryId,
 
      isActive: true,
 
      "brand.name": {
        $regex: new RegExp(`^${brandName}$`, "i"),
      },
    };
 
    const products = await SellerInventory.find(filter).select(
      "name price discountPrice brand media",
    );
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
      })),
    );
 
    return res.status(200).json({
      success: true,
      brand: brandName,
 
      totalProducts: formattedProducts.length,
 
      products: formattedProducts,
    });
  } catch (error) {
    console.error(error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   PRODUCTS BY BRAND + SUB-SUBCATEGORY
========================================================= */
 
exports.getProductsByBrandAndSubSubcategory = async (req, res) => {
  try {
    const { subSubcategoryId, brandName } = req.params;
 
    const filter = {
      subSubcategory: subSubcategoryId,
 
      isActive: true,
 
      "brand.name": {
        $regex: new RegExp(`^${brandName}$`, "i"),
      },
    };
 
    const products = await SellerInventory.find(filter).select(
      "name price discountPrice brand media",
    );
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
      })),
    );
 
    res.status(200).json({
      success: true,
      brand: brandName,
 
      totalProducts: formattedProducts.length,
 
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   PRODUCTS BY BRAND + PRODUCT TYPE
========================================================= */
 
exports.getProductsByBrandAndProductType = async (req, res) => {
  try {
    const { productTypeId, brandName } = req.params;
 
    const filter = {
      productType: productTypeId,
 
      isActive: true,
 
      "brand.name": {
        $regex: new RegExp(`^${brandName}$`, "i"),
      },
    };
 
    const products = await SellerInventory.find(filter).select(
      "name price discountPrice brand media",
    );
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
      })),
    );
 
    res.status(200).json({
      success: true,
      brand: brandName,
 
      totalProducts: formattedProducts.length,
 
      products: formattedProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
/* =========================================================
   PRICE RANGE + SUBCATEGORY
========================================================= */
 
exports.getProductsByPriceRangeAndSubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    const { min, max } = req.query;
 
    const filter = {
      subcategory: new mongoose.Types.ObjectId(subcategoryId),
 
      isActive: true,
 
      price: {},
    };
 
    if (min) {
      filter.price.$gte = Number(min);
    }
 
    if (max) {
      filter.price.$lte = Number(max);
    }
 
    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media")
      .sort({
        price: 1,
      });
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice || p.price,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
      })),
    );
 
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
 
/* =========================================================
   PRICE RANGE + SUB-SUBCATEGORY
========================================================= */
 
exports.getProductsByPriceRangeAndSubSubcategory = async (req, res) => {
  try {
    const { subSubcategoryId } = req.params;
 
    const { min, max } = req.query;
 
    const filter = {
      subSubcategory: new mongoose.Types.ObjectId(subSubcategoryId),
 
      isActive: true,
 
      price: {},
    };
 
    if (min) {
      filter.price.$gte = Number(min);
    }
 
    if (max) {
      filter.price.$lte = Number(max);
    }
 
    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media")
      .sort({
        price: 1,
      });
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice || p.price,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
      })),
    );
 
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
 
/* =========================================================
   PRICE RANGE + PRODUCT TYPE
========================================================= */
 
exports.getProductsByPriceRangeAndProductType = async (req, res) => {
  try {
    const { productTypeId } = req.params;
 
    const { min, max } = req.query;
 
    const filter = {
      productType: new mongoose.Types.ObjectId(productTypeId),
 
      isActive: true,
 
      price: {},
    };
 
    if (min) {
      filter.price.$gte = Number(min);
    }
 
    if (max) {
      filter.price.$lte = Number(max);
    }
 
    const products = await SellerInventory.find(filter)
      .select("name price discountPrice brand media")
      .sort({
        price: 1,
      });
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice || p.price,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
      })),
    );
 
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
 
/* =========================================================
   IN-STOCK PRODUCTS BY SUBCATEGORY
========================================================= */
 
exports.getInStockProductsBySubcategory = async (req, res) => {
  try {
    const { subcategoryId } = req.params;
 
    const products = await SellerInventory.find({
      subcategory: new mongoose.Types.ObjectId(subcategoryId),
 
      isActive: true,
 
      quantity: {
        $gt: 0,
      },
    }).select("name price discountPrice brand media");
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice || p.price,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
 
        inStock: true,
      })),
    );
 
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
 
/* =========================================================
   IN-STOCK PRODUCTS BY SUB-SUBCATEGORY
========================================================= */
 
exports.getInStockProductsBySubSubcategory = async (req, res) => {
  try {
    const { subSubcategoryId } = req.params;
 
    const products = await SellerInventory.find({
      subSubcategory: new mongoose.Types.ObjectId(subSubcategoryId),
 
      isActive: true,
 
      quantity: {
        $gt: 0,
      },
    }).select("name price discountPrice brand media");
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice || p.price,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
 
        inStock: true,
      })),
    );
 
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
 
/* =========================================================
   IN-STOCK PRODUCTS BY PRODUCT TYPE
========================================================= */
 
exports.getInStockProductsByProductType = async (req, res) => {
  try {
    const { productTypeId } = req.params;
 
    const products = await SellerInventory.find({
      productType: new mongoose.Types.ObjectId(productTypeId),
 
      isActive: true,
 
      quantity: {
        $gt: 0,
      },
    }).select("name price discountPrice brand media");
 
    const formattedProducts = await Promise.all(
      products.map(async (p) => ({
        _id: p._id,
        name: p.name,
 
        price: p.price,
 
        discountPrice: p.discountPrice || p.price,
 
        brand: p.brand?.name || null,
 
        logo: await getSignedUrl(p.brand?.logo),
 
        image: await getFirstImage(p.media),
 
        media: await getSignedMedia(p.media),
 
        inStock: true,
      })),
    );
 
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
 
/* =========================================================
   FILTERED PRODUCTS
========================================================= */
 
exports.getFilteredProducts = async (req, res) => {
  try {
    const {
      categoryId,
      subcategoryId,
      subSubcategoryId,
      productTypeId,
      brand,
      minPrice,
      maxPrice,
      inStock,
      sort = "latest",
      page = 1,
      limit = 12,
    } = req.query;
 
    const pageNum = Number(page);
    const limitNum = Number(limit);
 
    const filter = {
      isActive: true,
    };
 
    /* ==========================
         CATEGORY
      ========================== */
 
    if (categoryId) {
      filter.category = new mongoose.Types.ObjectId(categoryId);
    }
 
    /* ==========================
         SUBCATEGORY
      ========================== */
 
    if (subcategoryId) {
      filter.subcategory = new mongoose.Types.ObjectId(subcategoryId);
    }
 
    /* ==========================
         SUB-SUBCATEGORY
      ========================== */
 
    if (subSubcategoryId) {
      filter.subSubcategory = new mongoose.Types.ObjectId(subSubcategoryId);
    }
 
    /* ==========================
         PRODUCT TYPE
      ========================== */
 
    if (productTypeId) {
      filter.productType = new mongoose.Types.ObjectId(productTypeId);
    }
 
    /* ==========================
         BRAND
      ========================== */
 
    if (brand) {
      filter["brand.name"] = {
        $regex: new RegExp(`^${brand}$`, "i"),
      };
    }
 
    /* ==========================
         STOCK
      ========================== */
 
    if (inStock === "true") {
      filter.quantity = {
        $gt: 0,
      };
    }
 
    const pipeline = [];
 
    /* ==========================
         MATCH
      ========================== */
 
    pipeline.push({
      $match: filter,
    });
 
    /* ==========================
         EFFECTIVE PRICE
      ========================== */
 
    pipeline.push({
      $addFields: {
        effectivePrice: {
          $cond: [
            {
              $gt: ["$discountPrice", 0],
            },
            "$discountPrice",
            "$price",
          ],
        },
      },
    });
 
    /* ==========================
         PRICE FILTER
      ========================== */
 
    if (minPrice || maxPrice) {
      const priceFilter = {};
 
      if (minPrice) {
        priceFilter.$gte = Number(minPrice);
      }
 
      if (maxPrice) {
        priceFilter.$lte = Number(maxPrice);
      }
 
      pipeline.push({
        $match: {
          effectivePrice: priceFilter,
        },
      });
    }
 
    /* ==========================
         CATEGORY LOOKUP
      ========================== */
 
    pipeline.push(
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
    );
 
    /* ==========================
         SUBCATEGORY LOOKUP
      ========================== */
 
    pipeline.push(
      {
        $lookup: {
          from: "subcategories",
          localField: "subcategory",
          foreignField: "_id",
          as: "subcategory",
        },
      },
      {
        $unwind: {
          path: "$subcategory",
          preserveNullAndEmptyArrays: true,
        },
      },
    );
 
    /* ==========================
         SUB-SUBCATEGORY LOOKUP
      ========================== */
 
    pipeline.push(
      {
        $lookup: {
          from: "subsubcategories",
          localField: "subSubcategory",
          foreignField: "_id",
          as: "subSubcategory",
        },
      },
      {
        $unwind: {
          path: "$subSubcategory",
          preserveNullAndEmptyArrays: true,
        },
      },
    );
 
    /* ==========================
         PRODUCT TYPE LOOKUP
      ========================== */
 
    pipeline.push(
      {
        $lookup: {
          from: "producttypes",
          localField: "productType",
          foreignField: "_id",
          as: "productType",
        },
      },
      {
        $unwind: {
          path: "$productType",
          preserveNullAndEmptyArrays: true,
        },
      },
    );
 
    /* ==========================
         SORT
      ========================== */
 
    let sortOption = {
      createdAt: -1,
    };
 
    switch (sort) {
      case "price-low-high":
        sortOption = {
          effectivePrice: 1,
        };
        break;
 
      case "price-high-low":
        sortOption = {
          effectivePrice: -1,
        };
        break;
 
      case "oldest":
        sortOption = {
          createdAt: 1,
        };
        break;
 
      case "latest":
      default:
        sortOption = {
          createdAt: -1,
        };
    }
 
    pipeline.push({
      $sort: sortOption,
    });
 
    /* ==========================
         PAGINATION
      ========================== */
 
    pipeline.push({
      $facet: {
        products: [
          {
            $skip: (pageNum - 1) * limitNum,
          },
 
          {
            $limit: limitNum,
          },
 
          {
            $project: {
              _id: 1,
 
              name: 1,
 
              price: 1,
 
              discountPrice: "$effectivePrice",
 
              media: 1,
 
              brand: "$brand.name",
 
              logo: "$brand.logo",
 
              inStock: {
                $gt: ["$quantity", 0],
              },
 
              category: "$category.name",
 
              subcategory: "$subcategory.name",
 
              subSubcategory: "$subSubcategory.name",
 
              productType: "$productType.name",
            },
          },
        ],
 
        totalCount: [
          {
            $count: "count",
          },
        ],
      },
    });
 
    const result = await SellerInventory.aggregate(pipeline);
 
    const rawProducts = result[0]?.products || [];
 
    const totalProducts = result[0]?.totalCount?.length
      ? result[0].totalCount[0].count
      : 0;
 
    /* =====================================================
         CONVERT FILTERED PRODUCT MEDIA TO S3 SIGNED URL
      ===================================================== */
 
    const products = await Promise.all(
      rawProducts.map(async (product) => {
        const media = await getSignedMedia(product.media);
 
        return {
          _id: product._id,
 
          name: product.name,
 
          price: product.price,
 
          discountPrice: product.discountPrice,
 
          brand: product.brand || null,
 
          logo: await getSignedUrl(product.logo),
 
          image: media.length > 0 ? media[0].url : null,
 
          media,
 
          inStock: product.inStock,
 
          category: product.category || null,
 
          subcategory: product.subcategory || null,
 
          subSubcategory: product.subSubcategory || null,
 
          productType: product.productType || null,
        };
      }),
    );
 
    return res.status(200).json({
      success: true,
 
      totalProducts,
 
      currentPage: pageNum,
 
      totalPages: Math.ceil(totalProducts / limitNum),
 
      products,
    });
  } catch (error) {
    console.error("getFilteredProducts error:", error);
 
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
 
 