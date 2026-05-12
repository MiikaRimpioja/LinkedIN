const createPool = require("./db_pool");

const getFieldsByDocumentId = async (req, res) => {
  const documentId = req.params.id;

  if (!documentId) {
    return res
      .status(400)
      .json({ error: "Document ID puuttuu URL-parametrista" });
  }

  try {
    const pool = await createPool();

    // Hae tuoterivit + linkitetty tuote_id
    const [productLines] = await pool.query(
      `SELECT 
         pl.id AS product_line_id,
         pl.document_id,
         pl.product_name,
         pl.code,
         pl.ordered_quantity,
         pl.shipped_quantity,
         pl.note,
         p.id AS product_id
       FROM product_lines pl
       LEFT JOIN product_codes link ON link.code_value = pl.code
       LEFT JOIN products p ON p.id = link.product_id
       WHERE pl.document_id = ?`,
      [documentId]
    );

    // Hae kaikki koodit kaikille tuotteille yhdellä haulla
    const productIds = productLines
      .map((p) => p.product_id)
      .filter((id) => id !== null);

    let codeMap = {};
    if (productIds.length > 0) {
      const [codes] = await pool.query(
        `SELECT product_id, code_type, code_value
         FROM product_codes
         WHERE product_id IN (?)`,
        [productIds]
      );

      // Ryhmittele koodit product_id:n mukaan
      codeMap = codes.reduce((acc, row) => {
        if (!acc[row.product_id]) acc[row.product_id] = [];
        acc[row.product_id].push({
          code_type: row.code_type,
          code_value: row.code_value,
        });
        return acc;
      }, {});
    }

    // Lisää other_codes jokaiseen tuoteriviin
    const products = productLines.map((row) => ({
      ...row,
      other_codes: codeMap[row.product_id] ?? [],
    }));

    // Hae lähettäjä
    const [senderRows] = await pool.query(
      `SELECT id, document_id, company, contact_person, address, city, postal_code, country
       FROM senders
       WHERE document_id = ?`,
      [documentId]
    );

    // Hae vastaanottaja
    const [receiverRows] = await pool.query(
      `SELECT id, document_id, contact_person, address, city, postal_code, country
       FROM receivers
       WHERE document_id = ?`,
      [documentId]
    );

    const sender = senderRows[0] ?? null;
    const receiver = receiverRows[0] ?? null;

    res.status(200).json({
      products,
      sender,
      receiver,
    });
  } catch (err) {
    console.error(
      `Virhe kenttien tai tuoterivien haussa dokumentille ID:llä ${documentId}:`,
      err.message
    );
    res
      .status(500)
      .json({ error: "Kenttien tai tuoterivien haku epäonnistui" });
  }
};

module.exports = getFieldsByDocumentId;
