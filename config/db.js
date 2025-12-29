const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    console.error('❌ MONGO_URI not set in .env');
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
