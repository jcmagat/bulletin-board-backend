const dotenv = require("dotenv");
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const s3 = new S3({
  region: process.env.AWS_BUCKET_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

exports.uploadFile = async (file) => {
  const { createReadStream, filename, mimetype, encoding } = await file;

  const fileStream = createReadStream();

  const uuid = uuidv4();
  const extension = filename.split(".").pop();
  const newFilename = uuid + "." + extension;

  const uploadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Body: fileStream,
    Key: newFilename,
  };

  return s3.upload(uploadParams).promise();
};

exports.getFileStream = (key) => {
  const downloadParams = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  };

  return s3.getObject(downloadParams).createReadStream();
};
