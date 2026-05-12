const mysql = require("mysql2/promise");
const getAwsRegion = require("../utils/get_region");
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

let pool = null;

async function createDbPool() {
  if (pool) return pool;

  const region = await getAwsRegion();
  const secretsManager = new SecretsManagerClient({ region });
  const command = new GetSecretValueCommand({ SecretId: "dbtiedot" });
  const secret = await secretsManager.send(command);
  const creds = JSON.parse(secret.SecretString);

  pool = mysql.createPool({
    host: creds.db_host,
    user: creds.db_username,
    password: creds.db_password,
    database: creds.db_name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 50,
  });

  return pool;
}

module.exports = createDbPool;
