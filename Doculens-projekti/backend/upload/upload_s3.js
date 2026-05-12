// uploadToS3.js (AWS SDK v3)
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const getAwsRegion = require("../utils/get_region");

// Funktio, joka hakee bucket-nimen Secrets Managerista
async function getBucketNameFromSecrets(region, secretId = "kuvabucketnimi") {
  const secretsManager = new SecretsManagerClient({ region });
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const secret = await secretsManager.send(command);

  if ("SecretString" in secret) {
    try {
      const parsed = JSON.parse(secret.SecretString);
      return parsed.bucket_name;
    } catch {
      throw new Error("Secret string is not valid JSON");
    }
  }
  throw new Error("Secret does not contain a string value");
}

async function uploadToS3(file) {
  const region = await getAwsRegion();
  const s3 = new S3Client({ region });
  const bucketName = await getBucketNameFromSecrets(region);

  const fileExt = path.extname(file.originalname);
  const s3Key = `pdfs/${uuidv4()}${fileExt}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await s3.send(command);

  const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;
  return { fileUrl, s3Key };
}

module.exports = uploadToS3;
