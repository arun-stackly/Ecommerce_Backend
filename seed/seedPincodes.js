const mongoose = require("mongoose");
const https = require("https");
const Pincode = require("../models/Pincode");
require("dotenv").config();

const DATA_URL = "https://raw.githubusercontent.com/sanand0/pincode/master/data/india-pincodes.json";

mongoose.connect(process.env.MONGO_URI);

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

(async () => {
  try {
    const data = await fetchJSON(DATA_URL);
    const formatted = data.map(p => ({
      pincode: p.pincode,
      city: p.district,
      state: p.stateName
    }));

    await Pincode.deleteMany();
    await Pincode.insertMany(formatted);
    console.log("✅ 19,000+ Indian pincodes seeded");
    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();