/* eslint-env mocha */
/* global afterEach, describe, it */
const { expect } = require("chai");

// Testit tiedostolle database/db_update_field.js

describe("database/db_update_field - updateProductLines", () => {
  // Polut jotka korvataan testeissä fake-moduuleilla require.cache:lla
  const dbPoolPath = require.resolve("../database/db_pool");
  const updateFieldPath = require.resolve("../database/db_update_field");

  // Siivotaan require-cache jokaisen testin jälkeen, jotta fake-moduulit
  // eivät vaikuta muihin testeihin.
  afterEach(() => {
    if (require.cache[dbPoolPath]) delete require.cache[dbPoolPath];
    if (require.cache[updateFieldPath]) delete require.cache[updateFieldPath];
  });

  it("should return 400 when payload is not an array", async () => {
    // Varmistetaan että module ei ole välimuistissa, jotta se käyttää
    // tähän testiin injektoitua fake-poolia.
    if (require.cache[updateFieldPath]) delete require.cache[updateFieldPath];

    // Fake-pool joka tarjoaa vain execute-metodin mutta ei tee mitään.
    const fakeCreatePool = () => ({ execute: async () => {} });
    require.cache[dbPoolPath] = {
      id: dbPoolPath,
      filename: dbPoolPath,
      loaded: true,
      exports: fakeCreatePool,
    };

    // Ladataan käsittelijä (updateProductLines) joka nyt käyttää fake-poolia
    const updateProductLines = require(updateFieldPath);

    // Lähetetään virheellinen payload (ei taulukkoa)
    const req = { body: { not: "an array" } };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.body = obj;
        return this;
      },
    };

    // Suoritetaan päivityskutsu
    await updateProductLines(req, res);

    // Odotamme 400-virhekoodia ja suomenkielistä virheviestiä
    expect(res.statusCode).to.equal(400);
    expect(res.body).to.be.an("object");
    expect(res.body.error).to.include("Odotettiin taulukkomuotoista dataa");
  });

  it("should update existing product and insert new product, returning correct counts", async () => {
    // Poistetaan mahdollinen cache moduulista jotta fake-pool otetaan käyttöön
    if (require.cache[updateFieldPath]) delete require.cache[updateFieldPath];

    // Kerätään kutsutut SQL-lauseet listaan jotta voimme tarkistaa ne
    const executed = [];

    // Mockattu pool joka vastaa SELECT/UPDATE/INSERT -kutsuihin
    const mockPool = {
      execute: async (sql, params) => {
        executed.push({ sql: String(sql), params });

        const lower = String(sql).toLowerCase();

        // SELECT-tarkistus: palautetaan rivi jos document_id === 1 ja product_name === 'A'
        if (lower.includes("select id from product_lines")) {
          if (params[0] === 1 && params[1] === "A") {
            return [[{ id: 7 }], []];
          }
          return [[], []];
        }

        // Muissa tapauksissa palautetaan tyhjä, onnistunut vastaus
        return [[], []];
      },
    };

    // Fake createPool joka palauttaa meidän mockPoolin
    const fakeCreatePool = () => Promise.resolve(mockPool);
    require.cache[dbPoolPath] = {
      id: dbPoolPath,
      filename: dbPoolPath,
      loaded: true,
      exports: fakeCreatePool,
    };

    const updateProductLines = require(updateFieldPath);

    // Kaksi rivipakettia: yksi olemassa oleva (päivitetään), yksi uusi (lisätään)
   const payload = [
  {
    product_line_id: 7,  // ← kriittinen
    document_id: 1,
    product_name: "A",
    code: "KA",           // ← funktio ei tunne kenttää nimeltä 'koodi', vaan odottaa 'code'
    ordered_quantity: 5,
    shipped_quantity: 5,
    note: "ok",
  },
  {
    document_id: 2,
    product_name: "B",
    code: "KB",
    ordered_quantity: 3,
    shipped_quantity: 2,
    note: "partial",
  },
];

    const req = { body: payload };
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        this.body = obj;
        return this;
      },
    };

    // Suoritetaan päivitys
    await updateProductLines(req, res);

    // Varmistetaan, että vastaus kertoo oikeista määrästä päivitettyjä ja lisättyjä
    expect(res.statusCode).to.equal(200);
    expect(res.body).to.be.an("object");
    expect(res.body.status).to.equal("OK");
    expect(res.body.updated).to.equal(1);
    expect(res.body.inserted).to.equal(1);
    expect(res.body.total).to.equal(2);

    // Tarkistetaan että SQL-kutsut sisälsivät odotetut INSERT/UPDATE -lauseet
    const sqls = executed.map((e) => e.sql.toLowerCase());
    expect(sqls.some((s) => s.includes("update product_lines"))).to.be.true;
    expect(sqls.some((s) => s.includes("update documents set status"))).to.be
      .true;
    expect(sqls.some((s) => s.includes("insert into product_lines"))).to.be
      .true;
  });
});
