const createDbPool = require("../database/db_pool");
const { URL } = require("url");

async function getPdfKeyFromDb(documentId) {
  const pool = await createDbPool();

  const query = "SELECT file_url FROM documents WHERE id = ?";
  const [rows] = await pool.execute(query, [documentId]);

  if (rows.length === 0) {
    return null;
  }

  const fullUrl = rows[0].file_url;

  // Varmista että arvo on merkkijono
  if (!fullUrl || typeof fullUrl !== "string") {
    return null;
  }

  try {
    const url = new URL(fullUrl);
    const s3Key = url.pathname.slice(1);
    return s3Key || null;
  } catch (err) {
    console.error("Virhe URL:n käsittelyssä:", err.message);
    return null;
  }
}

module.exports = getPdfKeyFromDb;
