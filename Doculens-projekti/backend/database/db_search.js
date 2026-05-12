/* Tämä tiedosto käsittelee hakupalkin tekemiä hakupyyntöjä tietokannasta. Se hakee dokumentteja, jotka vastaavat annettua hakusanaa ja/tai päivämäärää. */

const createPool = require("./db_pool");

const getSearchResults = async (req, res) => {
  let pool;

  try {
    pool = await createPool();
  } catch (err) {
    console.error("Tietokantayhteyden luonti epäonnistui:", err);
    return res
      .status(500)
      .json({ error: "Tietokantayhteyden luonti epäonnistui" });
  }

  try {
    const keyword = req.query.searchTerm?.trim() ?? null;
    const dateParam = req.query.searchDate?.trim() ?? null;

    const isKeywordPresent = !!keyword;
    const isDateValid = /^\d{4}-\d{2}-\d{2}$/.test(dateParam);
    const isNumeric = /^\d+$/.test(keyword);

    let results;

    if (isKeywordPresent && isDateValid) {
      // Hakusana + päivämäärä
      if (isNumeric) {
        [results] = await pool.query(
          `
          SELECT * FROM documents
          WHERE (modified_by = ? OR id = ?)
            AND DATE(upload_date) = ?
            AND status = "processed"
          ORDER BY upload_date DESC
          LIMIT 20
          `,
          [keyword, keyword, dateParam]
        );
      } else {
        [results] = await pool.query(
          `
          SELECT *
          FROM documents
          WHERE (filename LIKE ? OR MATCH(sender) AGAINST(? IN NATURAL LANGUAGE MODE))
            AND DATE(upload_date) = ?
            AND status = "processed"
          ORDER BY upload_date DESC
          LIMIT 20
          `,
          [`%${keyword}%`, keyword, dateParam]
        );
      }
    } else if (isKeywordPresent) {
      // Vain hakusana
      if (isNumeric) {
        [results] = await pool.query(
          `
          SELECT * FROM documents
          WHERE (modified_by = ? OR id = ?)
            AND status = "processed"
          ORDER BY upload_date DESC
          LIMIT 20
          `,
          [keyword, keyword]
        );
      } else {
        [results] = await pool.query(
          `
          SELECT *
          FROM documents
          WHERE (filename LIKE ? OR MATCH(sender) AGAINST(? IN NATURAL LANGUAGE MODE))
            AND status = "processed"
          ORDER BY upload_date DESC
          LIMIT 20
          `,
          [`%${keyword}%`, keyword]
        );
      }
    } else if (isDateValid) {
      // Vain päivämäärä
      [results] = await pool.query(
        `
        SELECT * FROM documents
        WHERE DATE(upload_date) = ?
          AND status = "processed"
        ORDER BY upload_date DESC
        LIMIT 20
        `,
        [dateParam]
      );
    } else {
      return res.status(400).json({
        error: "Hakusana tai päivämäärä puuttuu tai on virheellisessä muodossa",
      });
    }

    if (results.length === 0) {
      console.log("Ei hakutuloksia haulle:", { keyword, dateParam });
    }

    return res.json(results);
  } catch (err) {
    console.error("Virhe tietokantahaussa:", err);
    return res
      .status(500)
      .json({ error: "Hakutulosten haku epäonnistui", details: err.message });
  }
};

module.exports = getSearchResults;
