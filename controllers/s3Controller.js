const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;


// ==========================================
// Upload Image to S3
// POST /api/s3/upload
// Content-Type: multipart/form-data
// ==========================================

const uploadImage = async (req, res) => {
  try {

    // ------------------------------------------
    // Check file
    // ------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }


    // ------------------------------------------
    // Get folder from request
    // ------------------------------------------

    const { folder = "products" } = req.body;


    // ------------------------------------------
    // Allowed S3 folders
    // ------------------------------------------

    const allowedFolders = [
      "products",
      "seller-inventories",
      "advertisements",
      "banners",
      "fashion",
      "electronics",
    ];


    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({
        success: false,
        message: "Invalid S3 folder",
      });
    }


    // ------------------------------------------
    // File details
    // ------------------------------------------

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
    // File size
    // Maximum 5 MB
    // ------------------------------------------

    const maxFileSize = 5 * 1024 * 1024;

    if (size > maxFileSize) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 5 MB",
      });
    }


    // ------------------------------------------
    // Get extension
    // ------------------------------------------

    const extension = originalname.includes(".")
      ? originalname.split(".").pop().toLowerCase()
      : "";


    // ------------------------------------------
    // Generate unique filename
    // ------------------------------------------

    const uniqueFileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}` +
      `${extension ? "." + extension : ""}`;


    // ------------------------------------------
    // S3 Object Key
    // ------------------------------------------

    const key = `${folder}/${uniqueFileName}`;


    // ------------------------------------------
    // Upload to S3
    // ------------------------------------------

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });


    await s3.send(command);


    // ==========================================
    // Generate image URL immediately
    // ==========================================

    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });


    const imageUrl = await getSignedUrl(
      s3,
      getCommand,
      {
        expiresIn: 3600, // 1 hour
      }
    );


    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",

      data: {
        key: key,
        imageUrl: imageUrl,

        folder: folder,

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
// Generate Presigned URL
// GET /api/s3/get-url?key=products/xxx.jpg
// ==========================================

const generateGetUrl = async (req, res) => {
  try {

    const { key } = req.query;


    if (!key) {
      return res.status(400).json({
        success: false,
        message: "S3 key is required",
      });
    }


    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });


    const imageUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 3600,
      }
    );


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


module.exports = {
  uploadImage,
  generateGetUrl,
};