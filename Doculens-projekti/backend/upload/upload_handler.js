const multer = require("multer");
const fs = require("fs");
const path = require("path");
const uploadToS3 = require("./upload_s3");
const saveToDatabase = require("./upload_db");
const runOCR = require("../ocr/run_ocr");
const convertPdfToPng = require("../utils/pdf2pic.js");
const upload = multer({ storage: multer.memoryStorage() });
const parseWithClaude = require("../ocr/claude_parser");
const saveDocumentData = require("../database/db_insert_fields");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const PdfUploadHandler = [
  upload.single("file"),
  async (req, res) => {
    try {
      const ocrResults = [];
      const file = req.file;

      if (!file)
        return res.status(400).json({ error: "Tiedostoa ei lähetetty" });

      if (!Buffer.isBuffer(file.buffer)) {
        file.buffer = Buffer.from(file.buffer);
      }

      if (file.mimetype !== "application/pdf")
        return res.status(400).json({ error: "Vain PDF-tiedostot sallittu" });

      if (file.size > MAX_FILE_SIZE)
        return res.status(400).json({ error: "Tiedosto ylittää 5 MB rajan" });

      // Vaihe 1: Tallennetaan alkuperäinen PDF S3:een
      let fileUrl, s3Key;
      try {
        const s3Result = await uploadToS3({
          buffer: file.buffer,
          originalname: file.originalname,
          folder: "pdfs",
          contentType: file.mimetype,
        });
        fileUrl = s3Result.fileUrl;
        s3Key = s3Result.s3Key;
      } catch (err) {
        console.error("S3-tallennus epäonnistui:", err.message);
        return res.status(500).json({ error: "S3-tallennus epäonnistui" });
      }

      if (!fileUrl || !s3Key) {
        return res.status(500).json({ error: "S3-tallennus epäonnistui" });
      }

      // Vaihe 2: Tallennetaan metatiedot tietokantaan
      const uploadedBy = req.user?.id || 0;
      const language = req.body.language || "fi";
      let documentId;

      try {
        const palletNumber = Number(req.body.pallet_number);

        const dbResult = await saveToDatabase({
          file,
          fileUrl,
          uploadedBy,
          language,
          pallet: palletNumber,
        });

        if (!dbResult || dbResult.affectedRows !== 1) {
          return res.status(500).json({ error: "DB-tallennus epäonnistui" });
        }

        documentId = dbResult.insertId;
      } catch (err) {
        console.error("DB-tallennus epäonnistui:", err.message);
        return res.status(500).json({ error: "DB-tallennus epäonnistui" });
      }

      // Vaihe 3: Tallennetaan PDF väliaikaisesti tiedostoksi
      const tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
      try {
        fs.writeFileSync(tempPdfPath, file.buffer);
      } catch (err) {
        console.error(
          "PDF:n tallennus väliaikaisesti epäonnistui:",
          err.message
        );
        return res.status(500).json({ error: "PDF:n tallennus epäonnistui" });
      }

      // Vaihe 4: Muunnetaan PDF PNG-kuviksi Popplerilla
      let pngFiles = [];
      let failedPages = [];

      try {
        pngFiles = await convertPdfToPng(tempPdfPath, tempDir);
      } catch (err) {
        console.error("PDF-muunnos epäonnistui:", err.message);
        return res
          .status(500)
          .json({ error: "PDF:n muuntaminen kuvaksi epäonnistui" });
      }

      // Vaihe 5: Tallennetaan jokainen PNG S3:een
      try {
        for (const png of pngFiles) {
          const imagePath = path.join(tempDir, png);
          const imageBuffer = fs.readFileSync(imagePath);

          await uploadToS3({
            buffer: imageBuffer,
            originalname: png,
            folder: "pdf-pages",
            contentType: "image/png",
          });
        }
      } catch (err) {
        console.error("PNG-tiedostojen S3-tallennus epäonnistui:", err.message);
        return res.status(500).json({ error: "PNG-tallennus epäonnistui" });
      }

      // Vaihe 6: Suoritetaan OCR jokaiselle kuvalle
      for (const png of pngFiles) {
        const inputPath = path.join(tempDir, png);
        try {
          const text = await runOCR(inputPath);
          ocrResults.push({ page: png, text });
        } catch (ocrErr) {
          console.warn(`OCR epäonnistui sivulla ${png}:`, ocrErr.message);
          const msg = ocrErr?.message || String(ocrErr);
          ocrResults.push({ page: png, error: "OCR epäonnistui: " + msg });
        }
      }

      // Vaihe 7: Jäsennetään OCR-tulokset Claude:lla
      const structuredResults = [];
      let senderName = null;

      for (const result of ocrResults) {
        if (result.text) {
          try {
            const { parsed, normalized } = await parseWithClaude(
              result.text,
              language
            );
            structuredResults.push({
              page: result.page,
              parsedRaw: parsed,
              parsedNormalized: normalized,
            });

            if (!senderName && normalized?.sender?.company) {
              senderName = normalized.sender.company;
            }
          } catch (err) {
            console.warn(
              `Claude epäonnistui sivulla ${result.page}:`,
              err.message
            );
            structuredResults.push({
              page: result.page,
              error: "Claude epäonnistui: " + err.message,
            });
          }
        } else {
          structuredResults.push(result);
        }
      }

      // Vaihe 7.5: Tallennetaan jäsennetyt kentät tietokantaan
      try {
        const normalizedOnly = structuredResults
          .filter((r) => r.parsedNormalized)
          .map((r) => r.parsedNormalized);

        const senders = normalizedOnly.map((r) => r.sender).filter(Boolean);
        const receivers = normalizedOnly.map((r) => r.receiver).filter(Boolean);
        const orders = normalizedOnly.map((r) => r.order).filter(Boolean);
        const products = normalizedOnly.flatMap((r) => r.items || []);

        await saveDocumentData(
          documentId,
          products,
          senders,
          receivers,
          orders,
          senderName
        );
      } catch (err) {
        console.error(
          "Kenttien tai tuoterivien tallennus epäonnistui:",
          err.message
        );
        return res.status(500).json({
          error: "Kenttien tai tuoterivien tallennus epäonnistui",
          err,
        });
      }

      // Vaihe 8: Siivotaan väliaikaiset tiedostot
      for (const f of [...pngFiles, path.basename(tempPdfPath)]) {
        try {
          fs.unlinkSync(path.join(tempDir, f));
        } catch (err) {
          console.warn(`Tiedoston poisto epäonnistui: ${f}`, err.message);
        }
      }

      // Vaihe 9: Palautetaan OCR- ja Claude-tulokset
      res.status(200).json({
        message: "PDF tallennettu, OCR suoritettu ja Claude jäsensi sisällön",
        ocrResults,
        skippedPages: failedPages,
        claudeResults: structuredResults.map((r) => ({
          page: r.page,
          raw: r.parsedRaw ?? null,
          normalized: r.parsedNormalized ?? null,
          error: r.error ?? null,
        })),
      });
    } catch (err) {
      console.error("PDF-tallennusvirhe:", err);
      res.status(500).json({ error: err.message || "Tallennus epäonnistui" });
    }
  },
];

module.exports = PdfUploadHandler;
