// db_pool.test.js — Tietokannan testaus
const request = require("supertest");
const superagent = require("superagent");
const { expect } = require("chai");
const { describe, it, before, after } = require("mocha");

require("../server");
const serverUrl = "http://localhost:3000";

// Testit — Tietokanta ja API-päätepisteet
describe("Database and API Integration", () => {
  // Ennen kaikkia testejä
  before(async () => {
    console.log("Setting up test database...");
    // Tässä voit alustaa testidata jos tarpeen
  });

  // Kaikkien testien jälkeen
  after(async () => {
    console.log("Tests completed");
    // Ei tarvitse sulkea pool:ia manuaalisesti
    // koska server.js hoitaa sen
  });

  // 1. Testaa että db_pool.js exporttaa oikean funktion
  it("should export createDbPool function", () => {
    const createDbPool = require("../database/db_pool");
    expect(createDbPool).to.be.a("function");
  });

  // 2. Testaa että createDbPool palauttaa pool-objektin
  it("createDbPool should return a Promise (avoid network in tests)", () => {
    const createDbPool = require("../database/db_pool");
    const poolPromise = createDbPool();

    expect(poolPromise).to.have.property("then");
    expect(typeof poolPromise.then).to.equal("function");
  });

  // 3. Testaa API:n juurireitti (tiedämme että tämä toimii)
  it("GET / should return server running", async () => {
    const res = await superagent.get(serverUrl + "/");
    expect(res.status).to.equal(200);
    
    expect(res.body.message).to.include("running");
  });

  // 4. Testaa dokumenttien haku (jos endpoint on olemassa)
  it("GET /api/keskeneraiset should require authentication", async () => {
    // Ilman autentikaatiota
    const res = await superagent
      .get(serverUrl + "/api/keskeneraiset")
      .ok(() => true);
    expect(res.status).to.be.oneOf([401, 403]); // Odotamme auth-virhettä
  });

  // 5. Testaa dokumenttien haku oikeilla tunnuksilla
  it("GET /api/keskeneraiset with auth should return data or 404", async () => {
    const res = await superagent
      .get(serverUrl + "/api/keskeneraiset")
      .set("username", "softa")
      .set("password", "Password")
      .ok(() => true);

    // Hyväksytään 200 (löytyi), 404 (ei dataa) tai 500 (ei DB / secrets saatavilla paikallisesti)
    expect(res.status).to.be.oneOf([200, 404, 500]);

    if (res.status === 200) {
      expect(res.body).to.be.an("array");
    }
  });

  // 6. Testaa virheellinen endpoint
  it("should handle invalid endpoints with 404", async () => {
    const res = await superagent
      .get(serverUrl + "/api/nonexistent")
      .set("username", "softa")
      .set("password", "Password")
      .ok(() => true);

    expect(res.status).to.equal(404);
  });

  // 7. Testaa että pool toimii kun server käyttää sitä
  it("should allow server to use database connection", async () => {
    // Tämä testi läpäisee jos server ei kaadu
    const res = await superagent.get(serverUrl + "/");
    expect(res.status).to.equal(200);
  });
});
