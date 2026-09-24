// utils/s3Helper.js

const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const s3 = require("../config/s3");

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;


/* ================= UPLOAD ================= */

const uploadToS3 = async (file, key) => {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return key;
};


/* ================= GET SIGNED URL ================= */

const getS3SignedUrl = async (key) => {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3, command, {
    expiresIn: 3600,
  });
};


/* ================= DELETE ================= */

const deleteFromS3 = async (key) => {
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  );
};


module.exports = {
  uploadToS3,
  getS3SignedUrl,
  deleteFromS3,
};