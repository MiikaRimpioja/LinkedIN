const createDbPool = require("../database/db_pool.js");

async function saveToDatabase({ file, fileUrl, uploadedBy, language, pallet }) {
  const pool = await createDbPool();

  try {
    // 🔹 Tarkistus: onko pallet jo käytössä keskeneräisissä dokumenteissa
    const [check] = await pool.execute(
      `SELECT COUNT(*) AS count FROM documents WHERE pallet = ? AND status != 'checked'`,
      [pallet]
    );

    if (check[0].count > 0) {
      throw new Error("Numero on jo käytössä");
    }

    // 🔹 Tallennus
    const [result] = await pool.execute(
      `
      INSERT INTO documents (filename, file_url, file_size, mime_type, uploaded_by, language, pallet, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        file.originalname,
        fileUrl,
        file.size,
        file.mimetype,
        uploadedBy,
        language,
        pallet,
        "pending",
      ]
    );

    return result;
  } catch (err) {
    console.error("Database insert failed:", err);
    throw new Error(err.message || "Failed to save file metadata");
  }
}

module.exports = saveToDatabase;
