/* eslint-env mocha */ // Ilmoittaa ESLintille, että tämä tiedosto käyttää Mocha-testikehystä
/* global describe, it */ // Sallii Mocha-funktioiden käytön ilman virheilmoituksia
const { expect } = require("chai"); // Tuodaan Chai testikirjasto (käytetään expect()-tarkistuksiin)

// Tuodaan testattava middleware-funktio (auth.js)
const auth = require("../utils/auth");

// Testiryhmä — testataan utils/auth -middlewarea
describe("utils/auth middleware", () => {

  
  // Testi 1 — puuttuvat tunnukset
  
  it("should return 401 when credentials missing", () => {
    // Simuloidaan pyyntö (request), jossa ei ole tunnistetietoja otsakkeissa
    const req = { headers: {} };

    // Luodaan feikki vastausobjekti (response), kuten Expressissä
    const res = {
      statusCode: null, // tänne tallennetaan statuskoodi
      body: null,       // tänne tallennetaan vastaussisältö
      status(code) {    // status() asettaa HTTP-koodin
        this.statusCode = code;
        return this;
      },
      send(payload) {   // send() lähettää vastaussisällön
        this.body = payload;
        return this;
      },
    };

    // next-funktio simuloidaan, jotta nähdään kutsutaanko se
    let calledNext = false;
    const next = () => {
      calledNext = true;
    };

    // Suoritetaan testattava auth-middleware
    auth(req, res, next);

    // Varmistetaan että next() EI kutsuttu (koska virhe)
    expect(calledNext).to.be.false;

    // Varmistetaan että palautettiin oikea HTTP-status ja viesti
    expect(res.statusCode).to.equal(401); // 401 = Unauthorized
    expect(res.body).to.equal("Missing credentials"); // oikea virheviesti
  });


  // Testi 2 — oikeat tunnukset
 
  it("should call next when credentials are correct", () => {
    // Pyynnössä on oikeat tunnukset (softa / Password)
    const req = { headers: { username: "softa", password: "Password" } };
    const res = {}; // ei tarvita muuta

    // Simuloidaan next() uudelleen
    let calledNext = false;
    const next = () => {
      calledNext = true;
    };

    // Suoritetaan middleware
    auth(req, res, next);

    // Tarkistetaan että next() todella kutsuttiin (eli pääsy sallittiin)
    expect(calledNext).to.be.true;
  });

 
  // Testi 3 — virheelliset tunnukset
  
  it("should return 403 when credentials are invalid", () => {
    // Pyynnössä on väärät tunnukset
    const req = { headers: { username: "x", password: "y" } };

    // Sama res-objekti kuin aiemmin
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

    // Simuloidaan next() jälleen
    let calledNext = false;
    const next = () => {
      calledNext = true;
    };

    // Suoritetaan auth-middleware
    auth(req, res, next);

    // Tarkistetaan että next() EI kutsuttu
    expect(calledNext).to.be.false;

    // Tarkistetaan että virhe palautettiin oikein
    expect(res.statusCode).to.equal(403); // 403 = Forbidden
    expect(res.body).to.equal("Invalid credentials"); // oikea virheviesti
  });
});
