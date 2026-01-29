const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

  username: { type: String, required: true, unique: true },

  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "Invalid email format"],
  },

  password: { type: String, required: true },

  // 🔑 SELLER / ADMIN ONLY
  role: {
    type: String,
    enum: ["seller", "admin"],
    default: "seller",
  },

  // ✅ ADMIN VERIFICATION
  isVerified: {
    type: Boolean,
    default: false,
  },

  // 🔐 OTP (future use)
  resetOTP: String,
  resetOTPExpiry: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/* 🔐 PASSWORD HASH */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* 🔑 PASSWORD MATCH */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
