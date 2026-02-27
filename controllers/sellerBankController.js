const SellerBank = require("../models/SellerBank");

/* ================= MASK FUNCTION ================= */
const maskAccountNumber = (acc) => {
  return "XXXXXX" + acc.slice(-4);
};

/* ================= VALIDATION FUNCTION ================= */
const validateBankDetails = (accountHolderName, accountNumber, ifscCode) => {
  if (accountHolderName.trim().length < 3) {
    return "Account holder name must be at least 3 characters";
  }

  const accountRegex = /^[0-9]{9,18}$/;
  if (!accountRegex.test(accountNumber)) {
    return "Account number must be 9 to 18 digits only";
  }

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifscCode.toUpperCase())) {
    return "Invalid IFSC format. Example: SBIN0001234";
  }

  return null;
};

/* ================= ADD BANK ================= */
exports.addBankDetails = async (req, res) => {
  try {
    const { accountHolderName, bankName, accountNumber, ifscCode, state } =
      req.body;

    if (
      !accountHolderName ||
      !bankName ||
      !accountNumber ||
      !ifscCode ||
      !state
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await SellerBank.findOne({ seller: req.user._id });

    if (existing) {
      return res.status(400).json({
        message: "Bank details already exist. Use update API.",
      });
    }

    const validationError = validateBankDetails(
      accountHolderName,
      accountNumber,
      ifscCode,
    );

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const bank = await SellerBank.create({
      seller: req.user._id,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
      state,
    });

    res.status(201).json({
      message: "Bank details added successfully",
      data: {
        ...bank._doc,
        accountNumber: maskAccountNumber(accountNumber),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE BANK ================= */
exports.updateBankDetails = async (req, res) => {
  try {
    const { accountHolderName, bankName, accountNumber, ifscCode, state } =
      req.body;

    const bank = await SellerBank.findOne({ seller: req.user._id });

    if (!bank) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    const validationError = validateBankDetails(
      accountHolderName,
      accountNumber,
      ifscCode,
    );

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    bank.accountHolderName = accountHolderName;
    bank.bankName = bankName;
    bank.accountNumber = accountNumber;
    bank.ifscCode = ifscCode.toUpperCase();
    bank.state = state;
    bank.verificationStatus = "pending";

    await bank.save();

    res.status(200).json({
      message: "Bank details updated successfully",
      data: {
        ...bank._doc,
        accountNumber: maskAccountNumber(accountNumber),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET BANK ================= */
exports.getBankDetails = async (req, res) => {
  try {
    const bank = await SellerBank.findOne({ seller: req.user._id });

    if (!bank) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    res.status(200).json({
      ...bank._doc,
      accountNumber: maskAccountNumber(bank.accountNumber),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
