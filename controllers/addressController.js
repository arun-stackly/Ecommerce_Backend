const Address = require("../models/addressModel");

/* GET USER ADDRESSES */
exports.getAddresses = async (req, res) => {
  const addresses = await Address.find({ userId: req.user._id });
  res.json(addresses);
};

/* ADD ADDRESS */
exports.addAddress = async (req, res) => {
  const address = await Address.create({
    ...req.body,
    userId: req.user._id,
  });

  res.status(201).json(address);
};

/* UPDATE ADDRESS */
exports.updateAddress = async (req, res) => {
  const address = await Address.findById(req.params.id);

  if (!address) return res.status(404).json({ message: "Not found" });

  Object.assign(address, req.body);

  await address.save();
  res.json(address);
};

/* DELETE ADDRESS */
exports.deleteAddress = async (req, res) => {
  await Address.findByIdAndDelete(req.params.id);
  res.json({ message: "Address removed" });
};

/* SET DEFAULT ADDRESS */
exports.setDefaultAddress = async (req, res) => {
  await Address.updateMany({ userId: req.user._id }, { isDefault: false });

  const address = await Address.findById(req.params.id);
  address.isDefault = true;

  await address.save();

  res.json(address);
};
