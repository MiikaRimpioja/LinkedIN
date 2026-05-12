# DocuLens Backend

Tämä README kuvaa DocuLens-projektin backendin toiminnallisuudet, arkkitehtuurin ja pääasialliset rajapinnat.

## Yleiskuvaus

Backend on Node.js/Express-sovellus, joka tarjoaa API-päätepisteet:

- PDF-tiedostojen vastaanotto ja tallennus
- PDF-tiedostojen lataus
- OCR-teksti- ja AI-jäsennys (Claude)
- Tietokantakyselyt keskeneräisille ja käsitellyille dokumenteille
- Tuoterivien ja metatietojen haku ja päivitys
- Endpoint-konfiguraation jakaminen

Backend toimii yhdessä AWS:n kanssa:

- AWS Secrets Manager tietokantayhteys- ja konfiguraatiotietoja varten
- AWS S3 PDF- ja sivukuva-tiedostojen tallennukseen (kuvatiedostojen tallennus poistettava tuotantoversiosta)
- AWS Bedrock / Claude-rutiinit OCR:n jäsennykseen
- EC2-metadataa käytetään AWS-regionin hakemiseen

## Konfiguraatio ja vaatimukset

Backend vaatii AWS-ympäristön, jossa on pääsy EC2-instance-metadataan ja Secrets Manageriin.

Tarvittavat salaisuudet:

- `dbtiedot` - sisältää MySQL-yhteyden parametrit
- `kuvabucketnimi` - S3-bucketin nimi PDF-latauksia varten
- `endpoints` - API-endpointien konfiguraatio, jaettavaksi frontendille

Lisäksi palvelin käyttää AWS-regionia EC2-metadatasta (`169.254.169.254`).

## Tiedostorakenne

Backend-kansion tärkeimmät kansiot ja tiedostot:

- `server.js` - Express-palvelimen määrittely ja reitit
- `database/` - tietokantayhteydet ja kyselyt
- `upload/` - PDF-latauksen ja metatietojen tallennuksen logiikka
- `download/` - PDF-lataus S3:sta ja tiedoston palautus
- `ocr/` - OCR-teksti (Tesseract) ja Claude-jäsennys
- `utils/` - yleiset apufunktiot, autentikointi, endpointit ja AWS-region
- `test/` - backend-yksikkötestit

## Arkkitehtuuri ja työnkulku

### PDF-latausprosessi

1. Asiakas lähettää PDF:n POST-pyynnöllä `POST /api/upload/pdf`.
2. `upload_handler` tarkistaa tunnistautumisen ja varmistaa, että tiedosto on PDF ja kooltaan enintään 5 MB.
3. PDF tallennetaan ensin S3:een kansioon `pdfs`.
4. Dokumentin metatiedot tallennetaan MySQL-tietokantaan `documents`-tauluun tilalla `pending`.
5. PDF muunnetaan sivuiksi (`PNG`) ja jokainen sivu tallennetaan S3:een kansioon `pdf-pages`. ( Kuvien tallennus debuggingia varten,voidaan poistaa tuotantoon siirryttäessä)
6. Jokaisesta sivusta suoritetaan OCR `Tesseract.js`:llä.
7. OCR-teksti jäsennetään Claude-mallilla (`ocr/claude_parser.js`) JSON-rakenteeksi.
8. Normaalisoidut kentät tallennetaan tietokantaan:
   - `senders`
   - `receivers`
   - `orders`
   - `product_lines`
9. Palvelin palauttaa API-vastauksena OCR- ja Claude-jäsennystulokset.

### Tiedostojen lataus

- `GET /api/download/pdf/:id` hakee dokumentin `file_url`-kentän tietokannasta, eristää S3-avaimen ja lataa PDF:n S3:sta.
- Vastauksessa palautetaan PDF-sisältö `inline`-tarkoitukseen.

### Tietokantakyselyt

- `GET /api/keskeneraiset` palauttaa kaikki dokumentit, joiden tila on `pending`.
- `GET /api/keskeneraiset/:id` palauttaa yksittäisen dokumentin tuoterivit, lähettäjän ja vastaanottajan tiedot.
- `POST /api/update/field` päivittää tuoterivejä ja asettaa dokumentin tilaan `processed`.
- `GET /api/update/field` palauttaa käsitellyt dokumentit, joiden tila on `processed`.
- `GET /api/processed/search` hakee käsiteltyjä dokumentteja hakutermin tai päivämäärän perusteella.
- `GET /api/endpoints` palauttaa frontendin tarvitseman endpoint-konfiguraation Secrets Managerista.

## Autentikointi

Backend käyttää yksinkertaista header-pohjaista autentikointia `utils/auth.js`.
Tunnukset ovat kovakoodatut, sillä oletuksena on että tuotantoon siirryttäessä sovellus liitetään osaksi olemassa olevaa autentikaatiojärjestelmää (yrityksen oma tunnistautuminen), jolloin sen tekeminen tähän demoon olisi ajan tuhlausta.

Vaaditut headerit:

- `username: softa`
- `password: Password`

Jos headerit puuttuvat tai ovat virheelliset, pyyntö hylätään.

## Tietokantakyselyt ja -taulut

Backend odottaa seuraavia tietokantatauluja:

- `documents`
- `senders`
- `receivers`
- `orders`
- `product_lines`
- `product_codes`
- `products`

Tietokanta yhdistetään AWS Secrets Managerista haettavien tietojen avulla.

## Käytetyt teknologiat

- Node.js
- Express
- MySQL (`mysql2/promise`)
- AWS SDK v3 (Bedrock, S3, Secrets Manager)
- Tesseract OCR
- Sharp
- Multer
- CORS
- UUID

## Huomioitavaa

- Backend olettaa pääsyn AWS EC2 -metadataan AWS-regionin hakemiseksi.
- S3- ja tietokantasalaisten sisältöjen tulee olla oikein määritelty Secrets Managerissa.
- Tällä hetkellä autentikointi on kovakoodattu demo-/kehityskäyttöön.

## Testaus

Backendissa on Mocha/Chai-pohjaisia testejä kansiossa `test/`.
Testit ajetaan automaattisesti GIT-workflowssa, main-haaraan puskettaessa.

Testit ajetaan komennolla:

```bash
npm test
```

---

Tämä README kattaa DocuLens-backendin toiminnallisuuden ja pääasialliset rajapinnat. \n
