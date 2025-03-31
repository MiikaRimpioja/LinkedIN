# portfolio-website

## Keskeneräinen projekti

Laravel-pohjainen verkkosovellus, joka käyttää Vue.js:ää.

## Tavoite

Tavoitteena on tehdä itselleni verkkosivut, joilla voin esitellä omia taitojani ja tekemiäni projekteja. Lisäksi sivuille on tarkoitus tehdä osio, joka vaatii kirjautumisen, ja jossa on käyttööni ajan/projektinhallinta työkaluja (tätä osiota aloitin jo tekemään, koska koin sen lopulta tärkeämmäksi kuin portfolion esittelyn).

## Asennus

1. Kloonaa repository:
    ```bash
    git clone https://github.com/kayttaja/portfolio-website.git
    ```

2. Asenna riippuvuudet:
    ```bash
    composer install
    npm install
    ```

3. Aseta ympäristömuuttujat `.env`-tiedostossa.

4. Käynnistä kehityspalvelin:
    ```bash
    php artisan serve
    npm run dev
    ```

## Käyttö

- Navigoi osoitteeseen `http://localhost:8000` nähdäksesi sovelluksen.
- Kirjaudu sisään nähdäksesi ajan/projektinhallinta työkalut.

## Ominaisuudet

- **Portfolio**: Esittele omia taitojasi ja projektejasi.
- **Ajan/projektinhallinta**: Työkalut, jotka vaativat kirjautumisen.

## Tulevat ominaisuudet

- Lisää projektien esittelyvaihtoehtoja.
- Parannettu käyttöliittymä.
- Lisää ajan/projektinhallinta ominaisuuksia.

## Lisenssi

Tämä projekti on lisensoitu MIT-lisenssillä. Katso LICENSE tiedosto lisätietoja varten.
