/* eslint-env mocha */
/* global describe, it, afterEach */
// Testit tiedostolle upload/upload_handler.js
// Tässä testataan kaksi pääskenaariota:
// 1) Virhetilanne kun tiedostoa ei ole lähetetty (palauttaa 400)
// 2) Onnistunut läpivienti: S3-tallennus, DB-insertti, PDF->PNG muunnos,
//    OCR, Claude-jäsennys ja normalisoitujen kenttien tallennus, lopuksi 200
// Testi käyttää require.cache -injektiota korvatakseen riippuvuudet
// (S3, DB, OCR, Claude, pdf2pic) feikeillä ja välttääkseen ulkoiset kutsut.
const { expect } = require("chai");
const fs = require("fs");
const path = require("path");

describe("upload/upload_handler - PdfUploadHandler", () => {
  const uploadPath = require.resolve("../upload/upload_handler");
  const uploadS3Path = require.resolve("../upload/upload_s3");
  const uploadDbPath = require.resolve("../upload/upload_db");
  const pdf2picPath = require.resolve("../utils/pdf2pic");
  const runOcrPath = require.resolve("../ocr/run_ocr");
  const claudePath = require.resolve("../ocr/claude_parser");
  const saveFieldsPath = require.resolve("../database/db_insert_fields");

  const tempDir = path.join(__dirname, "..", "upload", "temp");

  afterEach(() => {
    // Siivotaan injektoidut fake-moduulit require.cache:sta,
    // jotta ne eivät vaikuta seuraaviin testeihin.
    [
      uploadPath,
      uploadS3Path,
      uploadDbPath,
      pdf2picPath,
      runOcrPath,
      claudePath,
      saveFieldsPath,
    ].forEach((p) => {
      if (require.cache[p]) delete require.cache[p];
    });

    // Poistetaan mahdolliset väliaikaistiedostot temp-hakemistosta.
    try {
      if (fs.existsSync(tempDir)) {
        fs.readdirSync(tempDir).forEach((f) =>
          fs.unlinkSync(path.join(tempDir, f))
        );
      }
    } catch {
      // ignore
    }
  });

  it("should return 400 when no file uploaded", async () => {
    const handler = require(uploadPath);
    // Handler on taulukko: [multerMiddleware, varsinainenKäsittelijä]
    const fn = handler[1];

    const req = { body: {} };
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.body = obj;
        return this;
      },
    };

    await fn(req, res);

    expect(res.statusCode).to.equal(400);
    expect(res.body).to.be.an("object");
    expect(res.body.error).to.include("Tiedostoa ei lähetetty");
  });

  it("should process upload end-to-end and return 200 with results", async () => {
    // Injektoidaan feikit ennen handlerin lataamista,
    // jotta handler käyttää näitä riippuvuuksia.
    if (require.cache[uploadPath]) delete require.cache[uploadPath];

    // Fake uploadToS3: palauttaa fileUrl ja s3Key ilman oikeaa S3-kutsua.
    require.cache[uploadS3Path] = {
      id: uploadS3Path,
      filename: uploadS3Path,
      loaded: true,
      exports: async () => ({
        fileUrl: "https://s3.example/test.pdf",
        s3Key: "pdfs/test.pdf",
      }),
    };

    // Fake upload_db: simuloi onnistunutta DB-inserttiä.
    require.cache[uploadDbPath] = {
      id: uploadDbPath,
      filename: uploadDbPath,
      loaded: true,
      exports: async () => ({ affectedRows: 1, insertId: 321 }),
    };

    // Fake pdf2pic: luo yhden PNG-tiedoston temp-hakemistoon ja
    // palauttaa sen tiedostonimen listassa.
    require.cache[pdf2picPath] = {
      id: pdf2picPath,
      filename: pdf2picPath,
      loaded: true,
      exports: async () => {
        try {
          if (!fs.existsSync(tempDir))
            fs.mkdirSync(tempDir, { recursive: true });
        } catch (err) {
          if (err && err.code !== "EEXIST") {
            throw err;
          }
        }
        const pngName = "page-1.png";
        fs.writeFileSync(path.join(tempDir, pngName), "pngdata");
        return [pngName];
      },
    };

    // Fake run_ocr: palauttaa vakion tekstin.
    require.cache[runOcrPath] = {
      id: runOcrPath,
      filename: runOcrPath,
      loaded: true,
      exports: async () => "Detected text on page",
    };

    // Fake claude_parser: palauttaa parsed/normalized-rakenteet,
    // joista normalized sisältää lähettäjän nimen.
    require.cache[claudePath] = {
      id: claudePath,
      filename: claudePath,
      loaded: true,
      exports: async () => ({
        parsed: { raw: "x" },
        normalized: { lahettaja: { yritys: "ACME" }, tuotteet: [] },
      }),
    };

    // Fake saveDocumentData: simuloi kenttien tallennusta (OK).
    require.cache[saveFieldsPath] = {
      id: saveFieldsPath,
      filename: saveFieldsPath,
      loaded: true,
      exports: async () => ({ status: "OK" }),
    };

    const handler = require(uploadPath);
    const fn = handler[1];

    // Luodaan feikki PDF-binary (< 5MB) ja asetetaan mimetype application/pdf.
    const fakeBuffer = Buffer.from("%PDF-1.4 fakepdf content");
    const req = {
      file: {
        buffer: fakeBuffer,
        mimetype: "application/pdf",
        originalname: "test.pdf",
        size: fakeBuffer.length,
      },
      body: { language: "fi" },
      user: { id: 7 },
    };

    const res = {
      statusCode: null,
      body: null,
      headers: {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.body = obj;
        return this;
      },
      setHeader(name, val) {
        this.headers[name] = val;
      },
    };

    await fn(req, res);

    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an("object");
    expect(res.body.message).to.include("PDF tallennettu");
    expect(Array.isArray(res.body.ocrResults)).to.be.true;
    expect(Array.isArray(res.body.claudeResults)).to.be.true;
  });
});
