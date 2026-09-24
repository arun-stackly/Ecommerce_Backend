const Kyc = require("../models/Kyc");

const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;


/* =========================================================
   UPLOAD KYC
========================================================= */

const uploadKyc = async (req, res) => {
  try {
    const exists = await Kyc.findOne({
      seller: req.user._id,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "KYC already submitted",
      });
    }

    if (!req.files || !req.files.idProof) {
      return res.status(400).json({
        success: false,
        message: "ID proof is required",
      });
    }

    if (
      req.body.isConfirmed !== true &&
      req.body.isConfirmed !== "true"
    ) {
      return res.status(400).json({
        success: false,
        message: "Please confirm document declaration",
      });
    }

    /* ================= FILE UPLOAD FUNCTION ================= */

    const uploadToS3 = async (file, folder) => {
      if (!file) return null;

      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(
          "Only JPG, JPEG, PNG, WEBP and PDF files are allowed"
        );
      }

      const maxFileSize = 5 * 1024 * 1024;

      if (file.size > maxFileSize) {
        throw new Error(
          "Each KYC document must be less than 5 MB"
        );
      }

      const extension = file.originalname.includes(".")
        ? file.originalname.split(".").pop().toLowerCase()
        : "";

      const uniqueFileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}` +
        `${extension ? "." + extension : ""}`;

      const key =
        `kyc/${req.user._id}/${folder}/${uniqueFileName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3.send(command);

      return key;
    };

    /* ================= UPLOAD DOCUMENTS ================= */

    const idProofKey = await uploadToS3(
      req.files.idProof[0],
      "id-proof"
    );

    const businessProofKey =
      req.files.businessProof?.[0]
        ? await uploadToS3(
            req.files.businessProof[0],
            "business-proof"
          )
        : null;

    const additionalDocumentKey =
      req.files.additionalDocument?.[0]
        ? await uploadToS3(
            req.files.additionalDocument[0],
            "additional-document"
          )
        : null;

    /* ================= SAVE KYC ================= */

    const kyc = await Kyc.create({
      seller: req.user._id,

      idProof: idProofKey,

      businessProof: businessProofKey,

      additionalDocument: additionalDocumentKey,

      isIndividualSeller:
        req.body.isIndividualSeller === true ||
        req.body.isIndividualSeller === "true",

      isConfirmed:
        req.body.isConfirmed === true ||
        req.body.isConfirmed === "true",
    });

    res.status(201).json({
      success: true,
      message: "KYC documents uploaded successfully",

      data: {
        _id: kyc._id,
        seller: kyc.seller,
        idProof: kyc.idProof,
        businessProof: kyc.businessProof,
        additionalDocument: kyc.additionalDocument,
        isIndividualSeller: kyc.isIndividualSeller,
        isConfirmed: kyc.isConfirmed,
      },
    });

  } catch (error) {
    console.error("KYC Upload Error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================================
   GET KYC
========================================================= */

const getKyc = async (req, res) => {
  try {
    const kyc = await Kyc.findOne({
      seller: req.user._id,
    }).lean();

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC not found",
      });
    }

    /* ================= GENERATE SIGNED URL ================= */

    const generateSignedUrl = async (key) => {
      if (!key) return null;

      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3, command, {
        expiresIn: 3600, // 1 hour
      });
    };

    const idProofUrl = await generateSignedUrl(
      kyc.idProof
    );

    const businessProofUrl = await generateSignedUrl(
      kyc.businessProof
    );

    const additionalDocumentUrl =
      await generateSignedUrl(
        kyc.additionalDocument
      );

    /* ================= RESPONSE ================= */

    res.status(200).json({
      success: true,
      data: {
        _id: kyc._id,
        seller: kyc.seller,

        idProof: idProofUrl,

        businessProof: businessProofUrl,

        additionalDocument: additionalDocumentUrl,

        isIndividualSeller: kyc.isIndividualSeller,

        isConfirmed: kyc.isConfirmed,

        createdAt: kyc.createdAt,
        updatedAt: kyc.updatedAt,
      },
    });

  } catch (error) {
    console.error("Get KYC Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  uploadKyc,
  getKyc,
};