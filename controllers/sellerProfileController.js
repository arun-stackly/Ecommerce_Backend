const SellerProfile = require("../models/SellerProfile");
const User = require("../models/User");

const {
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;


/* =====================================================
   GET SELLER PROFILE
   GET /api/seller/profile
===================================================== */

exports.getSellerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    const profile = await SellerProfile.findOne({
      user: req.user._id,
    });

    if (!user || !profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    /* =================================================
       GENERATE SIGNED URL FROM S3 KEY
    ================================================= */

    let profileImageUrl = null;

    if (profile.profileImage) {
      try {
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: profile.profileImage,
        });

        profileImageUrl = await getSignedUrl(
          s3,
          command,
          {
            expiresIn: 3600,
          }
        );
      } catch (error) {
        console.error(
          "Failed to generate seller profile image URL:",
          error.message
        );

        profileImageUrl = null;
      }
    }

    /* =================================================
       RESPONSE
    ================================================= */

    return res.status(200).json({
      success: true,

      id: user._id,

      fullName: `${user.firstName} ${user.lastName}`,

      firstName: user.firstName,
      lastName: user.lastName,

      username: user.username,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      joinedDate: user.createdAt,

      phone: profile.phone,
      address: profile.address,
      registeredContact: profile.registeredContact,

      // Signed URL for frontend
      profileImage: profileImageUrl,

      // Actual S3 key
      profileImageKey: profile.profileImage,
    });

  } catch (error) {
    console.error(
      "Get Seller Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =====================================================
   UPDATE SELLER PROFILE
   PUT /api/seller/profile

   Content-Type:
   multipart/form-data

   Fields:
   firstName
   lastName
   phone
   address
   registeredContact
   profileImage -> File
===================================================== */

exports.updateSellerProfile = async (req, res) => {
  try {

    console.log("REQ.BODY:", req.body);
    console.log("REQ.FILE:", req.file);


    /* =================================================
       GET FORM DATA
    ================================================= */

    const {
      firstName,
      lastName,
      phone,
      address,
      registeredContact,
    } = req.body;


    /* =================================================
       FIND SELLER PROFILE
    ================================================= */

    const profile = await SellerProfile.findOne({
      user: req.user._id,
    });

    console.log(
      "Logged user ID:",
      req.user._id
    );

    console.log(
      "Seller profile found:",
      profile
    );


    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }


    /* =================================================
       UPDATE PROFILE DATA
    ================================================= */

    if (firstName !== undefined) {
      // handled below in User collection
    }

    if (lastName !== undefined) {
      // handled below in User collection
    }

    if (phone !== undefined) {
      profile.phone = phone;
    }

    if (address !== undefined) {
      profile.address = address;
    }

    if (registeredContact !== undefined) {
      profile.registeredContact = registeredContact;
    }


    /* =================================================
       UPLOAD PROFILE IMAGE TO S3
    ================================================= */

    if (req.file) {

      const {
        originalname,
        mimetype,
        buffer,
        size,
      } = req.file;


      /* ===============================================
         ALLOWED IMAGE TYPES
      =============================================== */

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


      /* ===============================================
         MAX FILE SIZE
         5 MB
      =============================================== */

      const maxFileSize =
        5 * 1024 * 1024;

      if (size > maxFileSize) {
        return res.status(400).json({
          success: false,
          message:
            "Image size must be less than 5 MB",
        });
      }


      /* ===============================================
         FILE EXTENSION
      =============================================== */

      const extension =
        originalname.includes(".")
          ? originalname
              .split(".")
              .pop()
              .toLowerCase()
          : "";


      /* ===============================================
         UNIQUE FILE NAME
      =============================================== */

      const uniqueFileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}` +
        `${extension ? "." + extension : ""}`;


      /* ===============================================
         S3 OBJECT KEY
      =============================================== */

      const key =
        `seller-profiles/${req.user._id}/${uniqueFileName}`;


      console.log(
        "Uploading seller profile image to S3:",
        key
      );


      /* ===============================================
         UPLOAD TO S3
      =============================================== */

      const command =
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
        });


      await s3.send(command);


      console.log(
        "Seller profile image uploaded to S3:",
        key
      );


      /* ===============================================
         SAVE ONLY S3 KEY
         NOT SIGNED URL
      =============================================== */

      profile.profileImage = key;
    }


    /* =================================================
       SAVE SELLER PROFILE
    ================================================= */

    await profile.save();


    /* =================================================
       UPDATE USER
    ================================================= */

    const user = await User.findById(
      req.user._id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }


    if (firstName !== undefined) {
      user.firstName = firstName;
    }

    if (lastName !== undefined) {
      user.lastName = lastName;
    }


    await user.save();


    /* =================================================
       GENERATE SIGNED URL
       ONLY FOR RESPONSE
    ================================================= */

    let profileImageUrl = null;

    if (profile.profileImage) {

      try {

        const command =
          new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: profile.profileImage,
          });


        profileImageUrl =
          await getSignedUrl(
            s3,
            command,
            {
              expiresIn: 3600,
            }
          );

      } catch (error) {

        console.error(
          "Failed to generate seller profile image URL:",
          error.message
        );

        profileImageUrl = null;
      }
    }


    /* =================================================
       RESPONSE
    ================================================= */

    return res.status(200).json({

      success: true,

      message:
        "Seller profile updated successfully",

      profile: {
        ...profile.toObject(),

        // Signed URL ONLY in API response
        profileImage: profileImageUrl,
      },

      id: user._id,

      fullName:
        `${user.firstName} ${user.lastName}`,

      firstName: user.firstName,
      lastName: user.lastName,

      phone: profile.phone,
      address: profile.address,
      registeredContact:
        profile.registeredContact,

      // Signed URL for frontend
      profileImage: profileImageUrl,

      // S3 key stored in MongoDB
      profileImageKey:
        profile.profileImage,
    });

  } catch (error) {

    console.error(
      "Update Seller Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};