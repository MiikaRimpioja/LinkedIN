/* eslint-env mocha */ // ESLint: tiedosto käyttää Mocha-testikehystä
/* global describe, it, afterEach */ // ESLint: salli Mocha-globaaleja

const { expect } = require("chai"); // Chai: expect() assertioita varten
const fs = require("fs"); // Node.js tiedostojärjestelmämoduuli
const os = require("os"); // Node.js OS-moduuli väliaikaishakemistoja varten
const path = require("path"); // Node.js polkujen käsittelyyn

// Testiryhmä pdf2pic:n toiminnalle
describe("pdf2pic (top-level) - convert behavior", () => {
  const childProc = require("child_process"); // Tarvitaan execFile:n stubbaamiseen
  let originalExecFile; // Tallennetaan alkuperäinen execFile myöhempää palautusta varten

  // Suoritetaan jokaisen testin jälkeen
  afterEach(() => {
    if (originalExecFile) childProc.execFile = originalExecFile; // Palautetaan alkuperäinen funktio
  });

  // Testi: onnistunut PDF -> PNG muunnos
  it("should export a function that resolves with file list when execFile succeeds", async () => {
    // Luodaan väliaikainen hakemisto ja feikki PNG-tiedosto
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdftest-"));
    fs.writeFileSync(path.join(tmpDir, "page-1.png"), "x");

    // Stubataan execFile niin, että se ei heitä virhettä
    originalExecFile = childProc.execFile;
    childProc.execFile = (cmd, args, cb) => {
      process.nextTick(() => cb(null)); // simuloi onnistunutta ajamista
    };

    // Ladataan moduuli uudestaan, jotta stubbi otetaan käyttöön
    delete require.cache[require.resolve("../utils/pdf2pic")];
    const convertPdfToPng = require("../utils/pdf2pic");

    // Kutsutaan funktiota
    const files = await convertPdfToPng("/fake/file.pdf", tmpDir, 100);

    // Siivotaan väliaikainen hakemisto
    fs.rmSync(tmpDir, { recursive: true, force: true });

    // Varmistetaan, että palautettu lista on taulukko ja sisältää feikki-tiedoston
    expect(files).to.be.an("array");
    expect(files).to.include("page-1.png");
  });

  // Testi: epäonnistunut PDF -> PNG muunnos
  it("should reject when execFile returns an error", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdftest-"));

    // Stubataan execFile niin, että se palauttaa virheen
    originalExecFile = childProc.execFile;
    childProc.execFile = (cmd, args, cb) => {
      process.nextTick(() => cb(new Error("pdftoppm not found")));
    };

    // Ladataan moduuli uudestaan stubin kanssa
    delete require.cache[require.resolve("../utils/pdf2pic")];
    const convertPdfToPng = require("../utils/pdf2pic");

    try {
      // Funktio pitäisi hylätä virheellä
      await convertPdfToPng("/fake/file.pdf", tmpDir, 100);
      throw new Error("Expected rejection"); // jos ei heitä virhettä, testi epäonnistuu
    } catch (err) {
      // Varmistetaan, että virhe on oikeanlainen ja sisältää odotetun tekstin
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.include("pdftoppm not found");
    } finally {
      // Siivotaan hakemisto ja palautetaan alkuperäinen execFile
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (originalExecFile) childProc.execFile = originalExecFile;
    }
  });
});
