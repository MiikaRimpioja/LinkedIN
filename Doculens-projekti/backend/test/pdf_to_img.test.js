/* eslint-env mocha */ // ESLint: tiedosto käyttää Mocha-testikehystä
/* global describe, it */ // ESLint: salli describe ja it globaalisti
const { expect } = require("chai"); // Tuodaan Chai: expect()-assertiot
const fs = require("fs"); // Node.js tiedostojärjestelmämoduuli
const path = require("path"); // Node.js polkutoiminnot

// Testiryhmä
describe("pdf_to_img script", () => {
  // Yksittäinen testi
  it("should reference a PDF->image implementation (pdf-poppler or pdftoppm)", function () {
    // Salli testin ohittaminen jos tiedostoa ei ole
    const candidates = [
      path.join(__dirname, "..", "pdf_to_img.js"),
      path.join(__dirname, "..", "utils", "pdf2pic.js"),
    ];

    const found = candidates.find((p) => fs.existsSync(p));
    if (!found) return this.skip();

    // Luetaan tiedosto tekstinä
    const src = fs.readFileSync(found, "utf8");

    // Hyväksytään joko require('pdf-poppler') + convert()-kutsu
    // tai pdftoppm/execFile -tyyppinen toteutus (utils/pdf2pic.js)
    const hasPoppler = /require\(['\"]pdf-poppler['\"]\)/.test(src);
    const hasConvertCall = /convert\s*\(/.test(src);
    const hasPdftoppm =
      /pdftoppm/.test(src) || /execFile\(\s*["']pdftoppm["']/.test(src);

    expect(hasPoppler || hasPdftoppm).to.equal(true);
    // Optionally ensure there is some convert/convertPdfToPng call or similar
    expect(hasConvertCall || hasPdftoppm).to.equal(true);
  });
});
