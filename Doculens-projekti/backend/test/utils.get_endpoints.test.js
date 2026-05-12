/* eslint-env mocha */ // Ilmoittaa ESLintille, että tämä on Mocha-testitiedosto
/* global describe, it, afterEach */ // Sallii Mocha-funktioiden käytön ilman virheilmoituksia
const { expect } = require("chai"); // Tuodaan Chai-kirjasto tarkistuksia varten

// Päätestisarja — testataan utils/get_endpoints.js -tiedoston "share_endpoints" -funktiota
describe("utils/get_endpoints - share_endpoints handler", () => {
  // Haetaan moduulien tiedostopolut, joita käytetään myöhemmin mockkaamiseen (feikkaamiseen)
  const awsPkgId = require.resolve("@aws-sdk/client-secrets-manager");
  const getRegionPath = require.resolve("../utils/get_region");
  const endpointsPath = require.resolve("../utils/get_endpoints");

  // Jokaisen testin jälkeen tyhjennetään Node.js:n require-välimuisti
  // Tämä varmistaa, että jokainen testi lataa moduulit puhtaalta pöydältä (ilman vanhoja mockeja)
  afterEach(() => {
    if (require.cache[awsPkgId]) delete require.cache[awsPkgId];
    if (require.cache[getRegionPath]) delete require.cache[getRegionPath];
    if (require.cache[endpointsPath]) delete require.cache[endpointsPath];
  });

 
  // Testi 1 — Onnistunut tilanne

  it("should return parsed JSON endpoints when secret contains SecretString", async () => {
    // Varmistetaan että endpoints-moduuli ei ole välimuistissa
    if (require.cache[endpointsPath]) delete require.cache[endpointsPath];

    // Mockataan get_region palauttamaan suoraan "eu-west-1"
    require.cache[getRegionPath] = {
      id: getRegionPath,
      filename: getRegionPath,
      loaded: true,
      exports: async () => "eu-west-1",
    };

    // Mockataan AWS SDK -asiakas, joka palauttaa feikki SecretString-arvon
    const fakeSecretsManagerModule = {
      SecretsManagerClient: class {
        constructor(opts) {
          this.opts = opts;
        }
        // Feikki send()-metodi, joka palauttaa salaisuuden muodossa { foo: "bar" }
        async send() {
          return { SecretString: JSON.stringify({ foo: "bar" }) };
        }
      },
      // Mock-komento AWS:lle, tässä ei tehdä oikeasti mitään
      GetSecretValueCommand: function (opts) {
        return opts;
      },
    };

    // Asetetaan mockattu AWS SDK välimuistiin
    require.cache[awsPkgId] = {
      id: awsPkgId,
      filename: awsPkgId,
      loaded: true,
      exports: fakeSecretsManagerModule,
    };

    // Ladataan testattava funktio
    const share_endpoints = require(endpointsPath);

    // Luodaan feikki req ja res -oliot, kuten Expressissä olisi
    const req = {};
    const res = {
      statusCode: null,
      body: null,
      // status() tallentaa HTTP-koodin
      status(code) {
        this.statusCode = code;
        return this;
      },
      // json() tallentaa palautettavan datan
      json(obj) {
        this.body = obj;
        return this;
      },
      // send() sama kuin json mutta tekstimuodossa
      send(obj) {
        this.body = obj;
        return this;
      },
    };

    // Suoritetaan testattava funktio (asynkroninen)
    await share_endpoints(req, res);

    // Tarkistetaan että palautus onnistui
    expect(res.statusCode).to.equal(200); // HTTP 200 = OK
    expect(res.body).to.be.an("object"); // Palautettu data on objekti
    expect(res.body.foo).to.equal("bar"); // Objekti sisältää kentän foo: "bar"
  });

  
  // Testi 2 — Epäonnistunut tilanne
  it("should return 500 when AWS client throws", async () => {
    // Tyhjennetään välimuisti
    if (require.cache[endpointsPath]) delete require.cache[endpointsPath];

    // Mockataan get_region taas palauttamaan alueen
    require.cache[getRegionPath] = {
      id: getRegionPath,
      filename: getRegionPath,
      loaded: true,
      exports: async () => "eu-west-1",
    };

    // Mockataan AWS SDK, mutta tällä kertaa se heittää virheen
    const fakeSecretsManagerModule = {
      SecretsManagerClient: class {
        constructor(opts) {
          this.opts = opts;
        }
        // Simuloidaan virhe AWS-yhteydessä
        async send() {
          throw new Error("AWS failure");
        }
      },
      GetSecretValueCommand: function (opts) {
        return opts;
      },
    };

    // Asetetaan tämä virheellinen mock AWS:n tilalle
    require.cache[awsPkgId] = {
      id: awsPkgId,
      filename: awsPkgId,
      loaded: true,
      exports: fakeSecretsManagerModule,
    };

    // Ladataan testattava funktio
    const share_endpoints = require(endpointsPath);

    // Sama feikki req/res kuin aiemmin
    const req = {};
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
      send(obj) {
        this.body = obj;
        return this;
      },
    };

    // Suoritetaan funktio, joka nyt heittää virheen
    await share_endpoints(req, res);

    // Tarkistetaan että virhe käsiteltiin oikein
    expect(res.statusCode).to.equal(500); // HTTP 500 = Server error
    expect(res.body).to.be.an("object"); // Palautettiin virheobjekti
    expect(res.body.error).to.include("Could not fetch endpoints"); // Virheviestissä oikea sisältö
  });
});
