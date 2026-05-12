/* eslint-env mocha */
/* global describe, it, afterEach */
const { expect } = require("chai");

// Testit tiedostolle download/download_handler.js

describe("download/download_handler - downloadPDF", () => {
  // Polut jotka korvataan testeissä fake-moduuleilla require.cache:lla
  const getS3Path = require.resolve("../download/get_s3_url");
  const downloadPdfPath = require.resolve("../download/download_pdf");
  const handlerPath = require.resolve("../download/download_handler");

  // Siivotaan require-cache joka testin jälkeen, jotta fake-moduulit
  // eivät vuoda tilaa muihin testeihin.
  afterEach(() => {
    if (require.cache[getS3Path]) delete require.cache[getS3Path];
    if (require.cache[downloadPdfPath]) delete require.cache[downloadPdfPath];
    if (require.cache[handlerPath]) delete require.cache[handlerPath];
  });

  it("should return 400 for invalid document id", async () => {
    // Ladataan käsittelijä normaalisti (ei fake-moduuleja tarvittu tähän testiin)
    const downloadPDF = require(handlerPath);

    // Virheellinen id-parametri (ei numeroa)
    const req = { params: { id: "abc" } };
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(payload) {
        this.body = payload;
        return this;
      },
    };

    await downloadPDF(req, res);

    // Odotamme 400-virheen ja suomenkielisen virheilmoituksen
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.equal("Virheellinen dokumentin ID");
  });

  it("should return 404 when s3Key is missing or invalid", async () => {
    // Varmistetaan että handler ei ole cache:ssa, jotta se käyttää meille
    // injektoitua fake-get_s3_url -funktiota.
    if (require.cache[handlerPath]) delete require.cache[handlerPath];

    // Fake get_s3_url palauttaa null (avainta ei löydy tietokannasta)
    require.cache[getS3Path] = {
      id: getS3Path,
      filename: getS3Path,
      loaded: true,
      exports: async () => null,
    };

    const downloadPDF = require(handlerPath);

    const req = { params: { id: "5" } };
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(payload) {
        this.body = payload;
        return this;
      },
    };

    await downloadPDF(req, res);

    // Odotamme 404-tilakoodin ja suomenkielisen viestin
    expect(res.statusCode).to.equal(404);
    expect(res.body).to.equal("s3Key puuttuu tai on virheellinen");
  });

  it("should return 500 when downloadFromS3 returns invalid result", async () => {
    // Poistetaan mahdollinen cache jotta fake-moduulit otetaan käyttöön
    if (require.cache[handlerPath]) delete require.cache[handlerPath];

    // Fake get_s3_url palauttaa kelvollisen avaimen
    require.cache[getS3Path] = {
      id: getS3Path,
      filename: getS3Path,
      loaded: true,
      exports: async () => "some/key.pdf",
    };

    // Fake download_pdf palauttaa virheellisen, tyhjän objektin
    require.cache[downloadPdfPath] = {
      id: downloadPdfPath,
      filename: downloadPdfPath,
      loaded: true,
      exports: async () => ({}),
    };

    const downloadPDF = require(handlerPath);

    const req = { params: { id: "6" } };
    const res = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(payload) {
        this.body = payload;
        return this;
      },
    };

    await downloadPDF(req, res);

    // Odotamme 500-virheen ja suomenkielisen virheilmoituksen
    expect(res.statusCode).to.equal(500);
    expect(res.body).to.equal("Virhe PDF:n latauksessa");
  });

  it("should set headers and pipe stream on success", async () => {
    // Poistetaan mahdollinen cache ja injektoidaan fake-get_s3_url
    if (require.cache[handlerPath]) delete require.cache[handlerPath];

    require.cache[getS3Path] = {
      id: getS3Path,
      filename: getS3Path,
      loaded: true,
      exports: async () => "files/doc.pdf",
    };

    // Fake-stream joka tallentaa mihin se pipetettiin
    const fakeStream = {
      pipedTo: null,
      pipe(dest) {
        this.pipedTo = dest;
        // Kutsutaan tarvittaessa myös end-metodia
        if (typeof dest.end === "function") dest.end();
      },
    };

    // Fake download_pdf palauttaa validin objektin, jonka sisällön lataaja
    // siirtää vastaukseen.
    require.cache[downloadPdfPath] = {
      id: downloadPdfPath,
      filename: downloadPdfPath,
      loaded: true,
      exports: async (s3Key) => {
        expect(s3Key).to.equal("files/doc.pdf");
        return {
          stream: fakeStream,
          contentType: "application/pdf",
          filename: "doc.pdf",
        };
      },
    };

    const downloadPDF = require(handlerPath);

    const req = { params: { id: "7" } };
    const res = {
      headers: {},
      statusCode: 200,
      body: null,
      setHeader(name, value) {
        this.headers[name] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.body = obj;
        return this;
      },
      end() {
        this._ended = true;
      },
    };

    await downloadPDF(req, res);

    // Varmistetaan että otsikot asetettiin ja stream pipetettiin vastaukseen
    expect(res.headers["Content-Type"]).to.equal("application/pdf");
    expect(res.headers["Content-Disposition"]).to.include("doc.pdf");
    expect(fakeStream.pipedTo).to.equal(res);
  });
});
