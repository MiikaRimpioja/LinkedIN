/* eslint-env mocha */
const { expect } = require("chai");
const { describe, it, afterEach } = require("mocha");

// Testataan funktiota saveDocumentData tiedostosta database/db_insert_fields
describe("database/db_insert_fields - saveDocumentData", () => {
  // Haetaan moduulien absoluuttiset polut, jotta niitä voidaan hallita välimuistissa
  const dbPoolPath = require.resolve("../database/db_pool");
  const insertFieldsPath = require.resolve("../database/db_insert_fields");

  afterEach(() => {
    // Tyhjennetään require-välimuisti jokaisen testin jälkeen
    // Tämä estää, että feikkimoduulit (mockit) jäävät vaikuttamaan muihin testeihin
    if (require.cache[dbPoolPath]) delete require.cache[dbPoolPath];
    if (require.cache[insertFieldsPath]) delete require.cache[insertFieldsPath];
  });

  //  Testi 1: Tarkistaa, että funktio heittää virheen jos syötteet eivät ole taulukoita
  it("should throw when non-array inputs are provided", async () => {
    // Varmistetaan, ettei moduuli ole jo ladattuna välimuistissa
    if (require.cache[insertFieldsPath]) delete require.cache[insertFieldsPath];

    // Luodaan feikkifunktio createPool, joka palauttaa tyhjän objektin
    // Näin vältetään oikea tietokantayhteys testin aikana
    const fakeCreatePool = () => ({ execute: async () => {} });

    // Tallennetaan tämä feikki db_pool.js -moduuliksi välimuistiin
    require.cache[dbPoolPath] = {
      id: dbPoolPath,
      filename: dbPoolPath,
      loaded: true,
      exports: fakeCreatePool,
    };

    // Ladataan testattava moduuli (joka käyttää nyt meidän feikkiä tietokantaa)
    const saveDocumentData = require(insertFieldsPath);

    try {
      // Kutsutaan funktiota virheellisellä syötteellä ("not-an-array")
      await saveDocumentData(1, "not-an-array", {}, [], []);
      // Jos virhettä ei tule, testi epäonnistuu
      throw new Error("Expected function to throw for invalid input");
    } catch (err) {
      // Tarkistetaan, että virhe on oikeaa tyyppiä ja sisältää odotetun viestin
      expect(err).to.be.instanceOf(Error);
      // Hyväksytään sekä "array-muotoista" että "taulukkomuotoista" -muodot
      expect(err.message).to.match(
        /Odotettiin\s+(?:array-muotoista|taulukkomuotoista)\s+dataa/i
      );
    }
  });

  //  Testi 2: Tarkistaa, että funktio toimii oikein kelvollisella datalla
  it("should call pool.execute and return counts for valid input", async () => {
    const executed = []; // Tänne tallennetaan kaikki SQL-lauseet, joita funktio ajaa

    // Luodaan feikkitietokantayhteys (mockPool)
    const mockPool = {
      execute: async (sql, params) => {
        // Tallennetaan jokainen SQL-komento ja sen parametrit
        executed.push({ sql: String(sql), params });
        // Palautetaan mysql2-kirjaston tapainen tulos
        return [[], []];
      },
    };

    // Poistetaan välimuistista mahdollinen aiempi versio moduulista
    if (require.cache[insertFieldsPath]) delete require.cache[insertFieldsPath];

    // Feikkifunktio createPool, joka palauttaa mockPoolin
    const fakeCreatePool = () => Promise.resolve(mockPool);

    // Asetetaan tämä feikki tietokantayhteys käyttöön db_pool -moduulin tilalle
    require.cache[dbPoolPath] = {
      id: dbPoolPath,
      filename: dbPoolPath,
      loaded: true,
      exports: fakeCreatePool,
    };

    // Ladataan testattava funktio (nyt se käyttää mockattua tietokantaa)
    const saveDocumentData = require(insertFieldsPath);

    // Luodaan testidataa: tuotteet, lähettäjät, vastaanottajat ja tilaukset
    const products = [
      {
        product_name: "Item A",
        koodi: "A1",
        ordered_quantity: 2,
        shipped_quantity: 2,
      },
      {
        product_name: "Item B",
        koodi: "B1",
        ordered_quantity: 1,
        shipped_quantity: 1,
      },
    ];

    const senders = [
      {
        yrittys: "JokuYritys",
        yhteyshenkilo: "Lahettaja1",
        osoite: "Street 1",
        kaupunki: "Helsinki",
        postinumero: "00100",
        maa: "FI",
      },
    ];

    const receivers = [
      {
        yhteyshenkilo: "saaja1",
        osoite: "Road 2",
        kaupunki: "Espoo",
        postinumero: "02100",
        maa: "FI",
      },
    ];

    const orders = [
      {
        myyntitilausnumero: "M-123",
        pakettinumero: "P-1",
        tilausaika: "2025-01-01",
        lahetysaika: "2025-01-02",
      },
    ];

    // Kutsutaan testattavaa funktiota testidatalla
    const result = await saveDocumentData(
      42, // dokumentin ID
      products,
      senders,
      receivers,
      orders,
      "Joku lähettäjä" // lähettäjän nimi
    );

    // Tarkistetaan, että palautettu arvo on oikeanlainen objekti
    expect(result).to.be.an("object");
    expect(result.status).to.equal("OK");

    // Varmistetaan, että funktio palautti oikeat määrät lisätyistä riveistä
    expect(result.inserted_products).to.equal(products.length);
    expect(result.inserted_senders).to.equal(senders.length);
    expect(result.inserted_receivers).to.equal(receivers.length);
    expect(result.inserted_orders).to.equal(orders.length);

    // Tarkistetaan, että SQL-komennot sisälsivät kaikki odotetut INSERT- ja UPDATE-lauseet
    const sqls = executed.map((e) => e.sql.toLowerCase());

    expect(sqls.some((s) => s.includes("update documents set sender"))).to.be
      .true;
    expect(sqls.some((s) => s.includes("insert into senders"))).to.be.true;
    expect(sqls.some((s) => s.includes("insert into receivers"))).to.be.true;
    expect(sqls.some((s) => s.includes("insert into orders"))).to.be.true;
    expect(sqls.some((s) => s.includes("insert into product_lines"))).to.be
      .true;
  });
});
