/* eslint-env mocha */
/* global describe, it, afterEach */
const { expect } = require("chai");
const fs = require("fs");
const os = require("os");
const path = require("path");

describe("utils/pdf2pic - convertPdfToPng", () => {
  const childProc = require("child_process");
  let originalExecFile;

  // Jokaisen testin jälkeen palautetaan alkuperäinen execFile-funktio
  afterEach(() => {
    if (originalExecFile) childProc.execFile = originalExecFile;
  });

  it("should return created PNG filenames when pdftoppm runs successfully", async () => {
    // Luo väliaikainen hakemisto testitiedostoille
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdftest-"));

    // Luo kaksi feikkiä PNG-tiedostoa simuloimaan pdftoppm-komennon tuottamia kuvia
    fs.writeFileSync(path.join(tmpDir, "page-1.png"), "x");
    fs.writeFileSync(path.join(tmpDir, "page-2.png"), "y");

    // Tallennetaan alkuperäinen execFile, jotta se voidaan palauttaa myöhemmin
    originalExecFile = childProc.execFile;

    // "Mockataan" execFile eli korvataan se testin ajaksi omalla versiolla,
    // joka ei oikeasti suorita mitään komentoa, vaan ilmoittaa heti onnistumisesta.
    childProc.execFile = (cmd, args, cb) => {
      process.nextTick(() => cb(null)); // Simuloi onnistunut suoritus
    };

    // Poistetaan moduuli välimuistista, jotta se käyttää juuri mockattua execFilea
    delete require.cache[require.resolve("../utils/pdf2pic")];
    const convertPdfToPng = require("../utils/pdf2pic");

    // Suoritetaan testattava funktio — annetaan sille feikki PDF ja hakemisto
    const files = await convertPdfToPng("/path/to/fake.pdf", tmpDir, 150);

    // Poistetaan väliaikainen hakemisto testin lopuksi
    fs.rmSync(tmpDir, { recursive: true, force: true });

    // Tarkistetaan, että funktio palauttaa taulukon tiedostonimistä
    expect(files).to.be.an("array");
    expect(files).to.include("page-1.png");
    expect(files).to.include("page-2.png");
  });

  it("should reject when execFile returns error", async () => {
    // Luo uusi väliaikainen hakemisto testille
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdftest-"));

    // Tallennetaan alkuperäinen execFile
    originalExecFile = childProc.execFile;

    // Mockataan execFile palauttamaan virhe — simuloidaan että pdftoppm puuttuu
    childProc.execFile = (cmd, args, cb) => {
      process.nextTick(() => cb(new Error("pdftoppm missing")));
    };

    // Poistetaan välimuistista moduuli, jotta se käyttää tätä mockia
    delete require.cache[require.resolve("../utils/pdf2pic")];
    const convertPdfToPng = require("../utils/pdf2pic");

    try {
      // Kutsutaan funktiota — pitäisi epäonnistua
      await convertPdfToPng("/path/to/fake.pdf", tmpDir, 150);

      // Jos tänne asti päästään, virhettä ei tullut — testi epäonnistuu
      throw new Error("Expected conversion to fail");
    } catch (err) {
      // Tarkistetaan, että virhe on oikean tyyppinen ja viesti sisältää odotetun tekstin
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.include("pdftoppm missing");
    } finally {
      // Siivotaan väliaikaiset tiedostot ja palautetaan execFile alkuperäiseksi
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (originalExecFile) childProc.execFile = originalExecFile;
    }
  });
});
