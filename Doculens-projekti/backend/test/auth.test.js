
// auth.test.js — Paikallaan pidettävä testitiedosto 


const { expect } = require("chai"); // Chai: odotusarvojen testaus (assertio)
const { describe, it } = require("mocha"); // Mocha: testien rakenne ja suoritus
const auth = require("../utils/auth"); // Testattava middleware


// mockRes() — Luo yksinkertaisen mock-vastauksen (res) middleware-testejä varten
// Tämä funktio jäljittelee Expressin response-objektia (res):
// - status(code): tallentaa statuskoodin
// - send(body): tallentaa lähetetyn datan
// - json(body): sama kuin send mutta JSON-muodossa
// Tallennetaan tulokset _body ja statusCode -muuttujiin vertailua varten.
function mockRes() {
  const res = {};
  res.statusCode = null; // tallennetaan asetettu HTTP status
  res._body = null; // tallennetaan lähetetty response body

  // Mockataan .status() — palauttaa itsensä ketjutusta varten
  res.status = function (code) {
    this.statusCode = code;
    return this;
  };

  // Mockataan .send() — tallentaa rungon (_body)
  res.send = function (body) {
    this._body = body;
    return this;
  };

  // Mockataan .json() — toimii kuten send
  res.json = function (body) {
    this._body = body;
    return this;
  };

  return res;
}
// Testit — auth middleware
// Testataan, että middleware reagoi oikein eri tilanteisiin:
// 1. Sallii oikeat tunnukset (status ei aseteta, next() kutsutaan)
// 2. Hylkää puuttuvat tunnukset (401 Unauthorized)
// 3. Hylkää virheelliset tunnukset (403 Forbidden)
describe("auth middleware", () => {

  // 1. Sallii oikeat tunnukset

  it("allows valid credentials", (done) => {
    // Luodaan request, jossa oikeat tunnukset
    const req = { headers: { username: "softa", password: "Password" } };
    const res = mockRes();

    // Jos tunnukset kelpaavat, auth kutsuu next()
    // -> done() kertoo että testi on onnistunut
    auth(req, res, () => done());
  });
  // 2. Hylkää puuttuvat tunnukset
  it("rejects missing credentials with 401", () => {
    const req = { headers: {} }; // Ei tunnuksia
    const res = mockRes();

    // Authin pitäisi palauttaa HTTP 401
    auth(req, res, () => {});
    expect(res.statusCode).to.equal(401);
  });
  // 3. Hylkää virheelliset tunnukset
  it("rejects invalid credentials with 403", () => {
    const req = { headers: { username: "x", password: "y" } };
    const res = mockRes();

    // Authin pitäisi palauttaa HTTP 403
    auth(req, res, () => {});
    expect(res.statusCode).to.equal(403);
  });
});
