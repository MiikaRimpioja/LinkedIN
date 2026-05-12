const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const getAwsRegion = require("../utils/get_region");
const { Readable } = require("stream");

// Hakee bucket-nimen Secrets Managerista
async function getBucketNameFromSecrets(region, secretId = "kuvabucketnimi") {
  if (!region || typeof region !== "string") {
    throw new Error("Virheellinen AWS-alue");
  }

  const secretsManager = new SecretsManagerClient({ region });
  const command = new GetSecretValueCommand({ SecretId: secretId });

  let secret;
  try {
    secret = await secretsManager.send(command);
  } catch (err) {
    throw new Error(`Secrets Manager -kutsu epäonnistui: ${err.message}`);
  }

  if (!secret || typeof secret !== "object") {
    throw new Error("Secrets Manager ei palauttanut kelvollista vastausta");
  }

  if ("SecretString" in secret) {
    try {
      const parsed = JSON.parse(secret.SecretString);
      if (!parsed.bucket_name || typeof parsed.bucket_name !== "string") {
        throw new Error("bucket_name puuttuu tai on virheellinen");
      }
      return parsed.bucket_name;
    } catch {
      throw new Error("Secret string ei ole kelvollista JSON-muotoa");
    }
  }

  throw new Error("Secret ei sisällä merkkijonoarvoa");
}

// Lataa tiedoston S3:sta ja palauttaa streamin + metatiedot
async function downloadFromS3(s3Key) {
  if (!s3Key || typeof s3Key !== "string" || s3Key.trim() === "") {
    console.error("S3-avain epäkelpo:", s3Key);
    throw new Error("Virheellinen S3-avaimen arvo");
  }

  const region = await getAwsRegion();
  const s3 = new S3Client({ region });
  const bucketName = await getBucketNameFromSecrets(region);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  let response;
  try {
    response = await s3.send(command);
  } catch (err) {
    throw new Error(`S3-lataus epäonnistui: ${err.message}`);
  }

  if (!response.Body || !(response.Body instanceof Readable)) {
    throw new Error("S3-vastaus ei sisällä kelvollista streamia");
  }

  const filename = s3Key.split("/").pop();
  if (!filename || typeof filename !== "string") {
    throw new Error("Tiedostonimi ei voitu päätellä S3-avaimesta");
  }

  // Fallback Content-Type logiikka PDF-tiedostoille
  const contentType =
    response.ContentType === "application/octet-stream" &&
    s3Key.toLowerCase().endsWith(".pdf")
      ? "application/pdf"
      : response.ContentType || "application/pdf";

  return {
    stream: response.Body,
    contentType,
    contentLength: response.ContentLength,
    filename,
  };
}

module.exports = downloadFromS3;
