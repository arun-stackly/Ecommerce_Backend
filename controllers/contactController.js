const ContactInfo = require(
  "../models/contactInfo"
);

/* ======================
   CREATE CONTACT INFO
====================== */
exports.createContactInfo =
  async (req, res) => {
    try {
      const existing =
        await ContactInfo.findOne();

      if (existing) {
        return res.status(400).json({
          success: false,
          message:
            "Contact info already exists",
        });
      }

      const contact =
        await ContactInfo.create(
          req.body
        );

      return res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ======================
   GET CONTACT INFO
====================== */
exports.getContactInfo =
  async (req, res) => {
    try {
      const contact =
        await ContactInfo.findOne();

      return res.status(200).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ======================
   UPDATE CONTACT INFO
====================== */
exports.updateContactInfo =
  async (req, res) => {
    try {
      const contact =
        await ContactInfo.findOneAndUpdate(
          {},
          req.body,
          {
            new: true,
            runValidators: true,
          }
        );

      return res.status(200).json({
        success: true,
        message:
          "Contact details updated successfully",
        data: contact,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* ======================
   DELETE CONTACT INFO
====================== */
exports.deleteContactInfo =
  async (req, res) => {
    try {
      await ContactInfo.deleteMany();

      return res.status(200).json({
        success: true,
        message:
          "Contact information deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };