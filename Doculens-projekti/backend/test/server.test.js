// server.test.js
// Tarkistaa, että sovelluksen juuri-endpoint toimii oikein
// Ei käynnistä serveriä uudelleen, käyttää jo käynnissä olevaa serveriä

const superagent = require("superagent");
const { expect } = require("chai");
const { describe, it } = require("mocha");

const serverUrl = "http://localhost:3000"; // oletetaan, että serveri on jo käynnissä

describe("GET /", () => {
  it("responds with server running", async () => {
    // Lähetetään GET / -pyyntö
    const res = await superagent.get(serverUrl + "/");
    // Tarkistetaan HTTP-status
    expect(res.status).to.equal(200);
    // Tarkistetaan JSON-body
    expect(res.body).to.have.property("message", "Server is running");
  });
});
