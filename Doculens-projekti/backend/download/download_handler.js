const getPdfKeyFromDb = require("./get_s3_url");
const downloadFromS3 = require("./download_pdf");

const downloadPDF = async (req, res) => {
  const documentId = req.params.id;

  // Tarkista että documentId on kelvollinen
  if (!documentId || isNaN(documentId) || parseInt(documentId) <= 0) {
    return res.status(400).send("Virheellinen dokumentin ID");
  }

  try {
    const s3Key = await getPdfKeyFromDb(documentId);

    // Tarkista että s3Key on merkkijono
    if (!s3Key || typeof s3Key !== "string" || s3Key.trim() === "") {
      return res.status(404).send("s3Key puuttuu tai on virheellinen");
    }

    const result = await downloadFromS3(s3Key);

    // Tarkista että downloadFromS3 palautti tarvittavat kentät
    if (
      !result ||
      !result.stream ||
      typeof result.contentType !== "string" ||
      typeof result.filename !== "string"
    ) {
      console.error("Virheellinen vastaus S3-latauksesta:", result);
      return res.status(500).send("Virhe PDF:n latauksessa");
    }

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${result.filename}"`
    );

    result.stream.pipe(res);
  } catch (err) {
    console.error("PDF:n lataus epäonnistui:", err);
    res
      .status(500)
      .json({ error: "Virhe PDF:n latauksessa", syy: err.message });
  }
};

module.exports = downloadPDF;
