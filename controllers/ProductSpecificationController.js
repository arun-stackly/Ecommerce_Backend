const Specification = require("../models/ProductSpecification");

const SellerInventory = require("../models/SellerInventory");

/* =========================================
   ADD SPECIFICATIONS
   POST /api/specifications/:sellerInventoryId
========================================= */
exports.addSpecifications =
  async (req, res) => {
    try {
      const { sellerInventoryId } =
        req.params;

      const { specs } = req.body;

      /* ===== INVENTORY CHECK ===== */

      const inventory =
        await SellerInventory.findById(
          sellerInventoryId,
        );

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      /* ===== DUPLICATE CHECK ===== */

      const existing =
        await Specification.findOne({
          sellerInventoryId,
        });

      if (existing) {
        return res.status(400).json({
          success: false,
          message:
            "Specifications already exist. Use update API.",
        });
      }

      /* ===== CREATE ===== */

      const specification =
        await Specification.create({
          sellerInventoryId,

          specs,
        });

      res.status(201).json({
        success: true,

        specification,
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  };

/* =========================================
   GET SPECIFICATIONS
   GET /api/specifications/:sellerInventoryId
========================================= */
exports.getSpecifications =
  async (req, res) => {
    try {
      const { sellerInventoryId } =
        req.params;

      const specification =
        await Specification.findOne({
          sellerInventoryId,
        });

      if (!specification) {
        return res.status(404).json({
          success: false,
          message:
            "Specifications not found",
        });
      }

      res.status(200).json({
        success: true,

        specs: specification.specs,
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  };

/* =========================================
   UPDATE SPECIFICATIONS
   PUT /api/specifications/:sellerInventoryId
========================================= */
exports.updateSpecifications =
  async (req, res) => {
    try {
      const { sellerInventoryId } =
        req.params;

      const { specs } = req.body;

      const specification =
        await Specification.findOneAndUpdate(
          {
            sellerInventoryId,
          },
          {
            specs,
          },
          {
            new: true,
          },
        );

      if (!specification) {
        return res.status(404).json({
          success: false,
          message:
            "Specifications not found",
        });
      }

      res.status(200).json({
        success: true,

        specification,
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  };

/* =========================================
   DELETE SPECIFICATIONS
   DELETE /api/specifications/:sellerInventoryId
========================================= */
exports.deleteSpecifications =
  async (req, res) => {
    try {
      const { sellerInventoryId } =
        req.params;

      const specification =
        await Specification.findOneAndDelete(
          {
            sellerInventoryId,
          },
        );

      if (!specification) {
        return res.status(404).json({
          success: false,
          message:
            "Specifications not found",
        });
      }

      res.status(200).json({
        success: true,

        message:
          "Specifications deleted",
      });

    } catch (error) {
      res.status(500).json({
        success: false,

        message: error.message,
      });
    }
  };