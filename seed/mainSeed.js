require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const SubSub = require('../models/SubSubcategory');

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI in .env before seeding.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  await Category.deleteMany({});
  await Subcategory.deleteMany({});
  await SubSub.deleteMany({});

  const categories = ["New Arrivals","Electronics","Fashion","Accessories","Appliances","Travel Booking","Food and Grocery"];
  const savedCats = [];
  for (const name of categories) {
    const c = new Category({ name, slug: name.toLowerCase().replace(/\s+/g,'-') });
    await c.save();
    savedCats.push(c);
  }

  const electronics = savedCats.find(c => c.name === 'Electronics');

  const subNames = ["Mobile&Accessories","Laptops&Accessories","TV & Home Entertainment","Audio","Cameras","Wearables","Batteries & chargers"];
  const savedSubs = [];
  for (const s of subNames) {
    const doc = new Subcategory({ name: s, slug: s.toLowerCase().replace(/\s+/g,'-'), category: electronics._id });
    await doc.save();
    savedSubs.push(doc);
  }

  const mobileSub = savedSubs.find(s => /mobile/i.test(s.name));
  const structure = {
    "Mobile Phones": ["Smart phones","Features phones","Foldable phones"],
    "Phone Cases & Covers": [],
    "Screen Protectors": [],
    "Chargers & Cables": [],
    "Power Banks": [],
    "Earphones & Headphones": [],
    "Car Mounts & Holders": [],
    "Memory Card & Storage": [],
    "Phone mounts": [],
    "Smartwatches & wearable": [],
    "Mobile Gaming Accessories": [],
    "Additional Accessories": []
  };

  const brands = [ { "Apple": [] }, { "vivo": [] }, { "Samsung": [] }, { "OnePlus": [] }, { "Huawei": [] }, { "Redmi": [] }, { "boat": [] }, { "Realme": [] }, { "Zebronics": [] }, { "Nokia": [] }, { "Oppo": [] }, { "Poco": [] }, { "Honor": [] }, { "Infinix": [] }, { "Motorola": [] } ];

  const priceRanges = ["Under ₹1000","₹1000-₹5000","₹10000-₹20000","over ₹20000"];
  const availabilityOptions = ["In stock","Out of stock"];

  const subsub = new SubSub({ category: electronics._id, subcategory: mobileSub._id, structure, brands, priceRanges, availabilityOptions });
  await subsub.save();

  console.log('Seed complete');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
