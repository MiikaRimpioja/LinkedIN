const createPool = require("./db_pool");

const updateProductLines = async (req, res) => {
  const pool = await createPool();
  const payload = req.body;

  // Varmistetaan että saatu data on taulukkomuodossa
  if (!Array.isArray(payload)) {
    return res
      .status(400)
      .json({ error: "Odotettiin taulukkomuotoista dataa" });
  }

  try {
    let updated = 0;
    let inserted = 0;

    for (const item of payload) {
      const {
        product_line_id,
        document_id,
        product_name,
        code,
        ordered_quantity,
        shipped_quantity,
        note,
      } = item;

      if (product_line_id && product_line_id !== 0) {
        // Päivitetään olemassa oleva tuoterivi
        await pool.execute(
          `UPDATE product_lines SET code = ?, ordered_quantity = ?, shipped_quantity = ?, note = ? WHERE id = ?`,
          [
            code ?? null,
            ordered_quantity ?? null,
            shipped_quantity ?? null,
            note ?? null,
            product_line_id ?? null,
          ]
        );

        // Päivitetään dokumentin tila
        await pool.execute(
          `UPDATE documents SET status = "processed" WHERE id = ?`,
          [document_id]
        );

        updated++;
      } else {
        // Lisätään uusi tuoterivi
        await pool.execute(
          `INSERT INTO product_lines (document_id, product_name, code, ordered_quantity, shipped_quantity, note)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            document_id,
            product_name,
            code ?? null,
            ordered_quantity ?? null,
            shipped_quantity ?? null,
            note ?? null,
          ]
        );
        inserted++;
      }
    }

    // Palautetaan yhteenveto päivitetyistä ja lisätyistä riveistä
    res.json({
      status: "OK",
      updated,
      inserted,
      total: updated + inserted,
    });
  } catch (err) {
    console.error("Virhe product_lines-päivityksessä:", err.message);
    res.status(500).json({ error: "Tietokantavirhe", err });
  }
};

module.exports = updateProductLines;
