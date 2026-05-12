/* eslint-env mocha */
/* global describe, it, afterEach */
const { expect } = require("chai");

describe("utils/get_region - getAwsRegion", () => {
  // Polut AWS:n metadatan (IMDSv2) eri vaiheisiin
  const TOKEN_PATH = "/latest/api/token"; // Tokenin hakupyyntö
  const METADATA_PATH = "/latest/dynamic/instance-identity/document"; // Varsinainen metadata (sis. region)

  let http;
  let originalRequest;

  // Jokaisen testin jälkeen palautetaan alkuperäinen http.request ja tyhjennetään moduulivälimuisti
  afterEach(() => {
    if (http && originalRequest) http.request = originalRequest;
    delete require.cache[require.resolve("../utils/get_region")];
  });

  it("should throw Metadata fetch failed when http.request errors", async () => {
    // Tämä testi tarkistaa, että funktio heittää virheen,
    // jos HTTP-pyyntö epäonnistuu (esim. verkkovirhe).

    http = require("http");
    originalRequest = http.request;

    // Luodaan feikki http.request-funktio, joka simuloi virhetilannetta
    http.request = () => {
      const events = {}; // Tallennetaan tapahtumakäsittelijät (on('error'), jne.)
      const req = {
        on: (ev, cb) => {
          events[ev] = cb; // Tallennetaan callbackit
        },
        write: () => {}, // Ei tehdä mitään
        end: () => {
          // Kun pyyntö "lähetetään", laukaistaan virhe seuraavassa event loop -kierrossa
          if (events.error)
            process.nextTick(() => events.error(new Error("net error")));
        },
      };
      return req; // Palautetaan simuloitu pyyntöobjekti
    };

    // Ladataan testattava moduuli
    const getAwsRegion = require("../utils/get_region");

    try {
      // Suoritetaan funktio — pitäisi epäonnistua
      await getAwsRegion();

      // Jos tähän päädytään, virhettä ei tullut -> testi epäonnistuu
      throw new Error("Expected getAwsRegion to throw");
    } catch (err) {
      // Tarkistetaan, että virhe on oikean tyyppinen ja viesti on oikea
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.include("Metadata fetch failed");
    }
  });

  it("should return region when metadata is returned (IMDSv2 flow)", async () => {
    // Tämä testi tarkistaa, että funktio toimii oikein,
    // kun AWS:n metadata-palvelu palauttaa datan onnistuneesti (IMDSv2).

    http = require("http");
    originalRequest = http.request;

    // Mockataan http.request niin, että se simuloi kahta eri pyyntöä:
    // 1) Tokenin hakua (PUT /latest/api/token)
    // 2) Metadatan hakua (GET /latest/dynamic/instance-identity/document)
    http.request = (options, callback) => {
      const events = {};
      const req = {
        on: (ev, cb) => {
          events[ev] = cb; // Tallennetaan callbackit kuten normaalisti
        },
        write: () => {},
        end: () => {}, // Ei tehdä mitään varsinaista
      };

      const EventEmitter = require("events").EventEmitter;
      const res = new EventEmitter(); // Luodaan feikki response-objekti

      // Ajetaan seuraavassa "tikissä" (eli heti seuraavassa vaiheessa)
      process.nextTick(() => {
        if (options.path === TOKEN_PATH && options.method === "PUT") {
          // Ensimmäinen vaihe: tokenin haku onnistuu
          res.emit("data", "fake-token");
          res.emit("end");
        } else if (options.path === METADATA_PATH && options.method === "GET") {
          // Toinen vaihe: metadata (sis. AWS region) palautetaan
          res.emit("data", JSON.stringify({ region: "eu-west-1" }));
          res.emit("end");
        } else {
          // Jos pyyntö on väärä, palautetaan virhe
          res.emit("error", new Error("unknown path"));
        }
      });

      // Moduulin oma funktio kutsuu callbackia, joten kutsutaan sitä nyt
      if (typeof callback === "function") callback(res);
      return req;
    };

    // Tyhjennetään moduulin välimuisti, jotta mockattu http otetaan käyttöön
    delete require.cache[require.resolve("../utils/get_region")];
    const getAwsRegion = require("../utils/get_region");

    // Kutsutaan funktiota, jonka pitäisi nyt palauttaa "eu-west-1"
    const region = await getAwsRegion();

    // Tarkistetaan, että funktio todella palauttaa oikean arvon
    expect(region).to.equal("eu-west-1");
  });
});
