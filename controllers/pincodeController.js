const axios = require("axios");

exports.lookupPincode = async (req, res) => {
  const { pincode } = req.body;

  if (!pincode || pincode.length !== 6) {
    return res.status(400).json({
      success: false,
      message: "Valid 6-digit pincode required",
    });
  }

  try {
    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    const result = response.data[0];

    if (result.Status !== "Success" || !result.PostOffice?.length) {
      return res.status(404).json({
        success: false,
        message: "Pincode not found",
      });
    }

    // ✅ STABLE SELECTION
    const offices = result.PostOffice;

    // Prefer HO / Main office
    const primary =
      offices.find((o) => o.BranchType === "Head Post Office") ||
      offices.find((o) => o.BranchType === "Sub Post Office") ||
      offices[0];

    const city = primary.Block || primary.District;

    res.status(200).json({
      success: true,
      data: {
        city,
        district: primary.District,
        state: primary.State,
        country: primary.Country,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Pincode service unavailable",
    });
  }
};
