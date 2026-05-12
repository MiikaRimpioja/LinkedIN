// getAwsRegion.js
const http = require("http");

const METADATA_HOST = "169.254.169.254";
const TOKEN_PATH = "/latest/api/token";
const METADATA_PATH = "/latest/dynamic/instance-identity/document";

const httpRequest = (options, body = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
};

const getAwsRegion = async () => {
  try {
    const token = await httpRequest({
      host: METADATA_HOST,
      path: TOKEN_PATH,
      method: "PUT",
      headers: {
        "X-aws-ec2-metadata-token-ttl-seconds": "21600",
      },
    });

    if (!token) throw new Error("Failed to retrieve IMDSv2 token");

    const metadataRaw = await httpRequest({
      host: METADATA_HOST,
      path: METADATA_PATH,
      method: "GET",
      headers: {
        "X-aws-ec2-metadata-token": token,
      },
    });

    const metadata = JSON.parse(metadataRaw);
    if (!metadata.region)
      throw new Error("Region not found in instance metadata");

    return metadata.region;
  } catch (err) {
    throw new Error(`Metadata fetch failed: ${err.message}`);
  }
};

module.exports = getAwsRegion;
