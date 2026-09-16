const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;


// ==========================================
// Upload Image to S3 using FormData
// POST /api/s3/upload
// ==========================================

const uploadImage = async (req, res) => {
  try {
    // Check whether file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const {
      originalname,
      mimetype,
      buffer,
      size,
    } = req.file;

    // ------------------------------------------
    // Allowed image types
    // ------------------------------------------

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedMimeTypes.includes(mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid image type. Only JPG, JPEG, PNG, WEBP and GIF are allowed.",
      });
    }

    // ------------------------------------------
    // File size validation
    // Maximum: 5 MB
    // ------------------------------------------

    const maxFileSize = 5 * 1024 * 1024;

    if (size > maxFileSize) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 5 MB",
      });
    }

    // ------------------------------------------
    // Get file extension
    // ------------------------------------------

    const extension = originalname.includes(".")
      ? originalname.split(".").pop().toLowerCase()
      : "";

    // ------------------------------------------
    // Generate unique file name
    // ------------------------------------------

    const uniqueFileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}` +
      `${extension ? "." + extension : ""}`;

    // ------------------------------------------
    // S3 folder
    // ------------------------------------------

    const folder = "products";

    // ------------------------------------------
    // S3 Object Key
    // ------------------------------------------

    const key = `${folder}/${uniqueFileName}`;

    // ------------------------------------------
    // Create S3 Upload Command
    // ------------------------------------------

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    // ------------------------------------------
    // Upload file to S3
    // ------------------------------------------

    await s3.send(command);

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",

      data: {
        key: key,
        fileName: uniqueFileName,
        originalName: originalname,
        contentType: mimetype,
        size: size,
      },
    });

  } catch (error) {
    console.error("S3 Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload image to S3",
      error: error.message,
    });
  }
};


// ==========================================
// Generate Presigned URL for Viewing Image
// GET /api/s3/get-url?key=products/xxx.jpg
// ==========================================

const generateGetUrl = async (req, res) => {
  try {
    const { key } = req.query;

    // ------------------------------------------
    // Validate key
    // ------------------------------------------

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "S3 key is required",
      });
    }

    // ------------------------------------------
    // Create GetObject command
    // ------------------------------------------

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    // ------------------------------------------
    // Generate signed URL
    // ------------------------------------------

    const imageUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 3600, // 1 hour
      }
    );

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Image URL generated successfully",

      data: {
        imageUrl: imageUrl,
        key: key,
      },
    });

  } catch (error) {
    console.error("S3 Get URL Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate S3 image URL",
      error: error.message,
    });
  }
};


// ==========================================
// Export Controllers
// ==========================================

module.exports = {
  uploadImage,
  generateGetUrl,
};