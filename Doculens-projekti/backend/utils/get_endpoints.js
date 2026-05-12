// share_endpoints.js (AWS SDK v3)
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const getAwsRegion = require("./get_region"); // EC2-metadatasta haettava region

// Funktio joka hakee endpointit AWS Secrets Managerista
const getEndpointsFromSecrets = async (secretId = "endpoints") => {
  const region = await getAwsRegion();
  const secretsManager = new SecretsManagerClient({ region });

  try {
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const secret = await secretsManager.send(command);
    console.log("Raw secret response:", secret);

    if ("SecretString" in secret) {
      try {
        const parsed = JSON.parse(secret.SecretString);
        console.log("Parsed secret JSON:", parsed);
        return parsed;
      } catch (parseError) {
        console.error(
          "Failed to parse secret string as JSON:",
          parseError.message
        );
        throw new Error("Secret string is not valid JSON");
      }
    } else {
      console.error("Secret does not contain a string value");
      throw new Error("Secret does not contain a string value");
    }
  } catch (awsError) {
    console.error("Error retrieving secret from AWS:", awsError.message);
    throw awsError;
  }
};

// Express-käsittelijä, joka palauttaa endpoint-konfiguraation
async function share_endpoints(req, res) {
  try {
    const endpoints = await getEndpointsFromSecrets();
    res.status(200).json(endpoints);
  } catch (error) {
    console.error("Error fetching endpoints:", error.message);
    res.status(500).send({
      error: "Could not fetch endpoints",
      details: error.message,
      stack: error.stack,
    });
  }
}

module.exports = share_endpoints;
