const createPool = require("./db_pool");

const getKeskeneraiset = async (req, res) => {
  try {
    const amount = parseInt(req.headers["amount"], 10) || 10;
    const pool = await createPool();
    const [rows] = await pool.query(
      "SELECT * FROM documents WHERE status = ? ORDER BY upload_date DESC LIMIT ?",
      ["processed", amount]
    );
    console.log("kyselyn tulokset:", rows);
    res.status(200).json(rows);
  } catch (err) {
    console.log(err);
    console.error("Virhe tietokantahaussa (kaikki valmiit):", err);
    res
      .status(500)
      .json({ error: "Valmiiden tiedostojen haku epäonnistui:", err });
  }
};

module.exports = getKeskeneraiset;
