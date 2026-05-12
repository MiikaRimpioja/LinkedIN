# Sovelluksen komponentit ja käyttö

Sovellus hallinnoi PDF-lähetyslistoja kolmen pääkomponentin kautta:

## Home-komponentti – Keskeneräiset dokumentit

Tarkoitus: Etusivu, jossa käyttäjä hallinnoi keskeneräisiä PDF-dokumentteja.

### Keskeiset toiminnot:

- Admin-/käyttäjänäkymät
- PDF-tiedoston lataus backendille
- Keskeneräisten dokumenttien listaaminen
- Haku lavanumerolla
- Notifikaatiot modalin kautta
- Navigointi valmiisiin dokumentteihin ja yksittäisen dokumentin tarkasteluun

### Tekniset huomiot:

- Fallback-data testaukseen
- ngModel-pohjaiset lomakkeet
- FileReader PDF-tiedoston muuntamiseen backendille

## InspectDocument-komponentti – Dokumentin tarkastelu ja muokkaus

Tarkoitus: Tarkastella ja muokata yksittäisen dokumentin tuoterivejä.

### Keskeiset toiminnot:

- PDF-dokumentin näyttö modaalissa
- Lähettäjän ja vastaanottajan tiedot
- Tuoterivien hallinta ja muokkaus
- Hakutoiminto: koodihakeminen ja automaattinen skrollaus/fokusointi
- Tuoterivien lähetys backendille
- Notifikaatiot modalin kautta
- Admin-/käyttäjänäkymä
- Kosketusnäytön tuki pyyhkäisyille
- Fallback-data testaukseen

### Tekniset huomiot:

Tuoterivit formatoidaan automaattisesti (tuotenimi iso ensimmäinen kirjain)
ViewChildren-viittauksia scrollaukseen ja input-fokusointiin
PDF haetaan backendistä Blob URL:ksi modaalissa

## DocumentList-komponentti – Valmiit dokumentit

Tarkoitus: Lista valmiista dokumenteista, hakumahdollisuus ja siirtyminen dokumentin tarkasteluun.

### Keskeiset toiminnot:

- Admin-/käyttäjänäkymät
- Valmiiden dokumenttien haku (hakusana + päivämäärä)
- Notifikaatiot modalin kautta
- Navigointi etusivulle (Home)
- Navigointi yksittäisen dokumentin tarkasteluun (InspectDocument)
- Fallback, jos backend ei vastaa

### Tekniset huomiot:

- Dokumenttilista renderöidään dynaamisesti @for-rakenteella
- Käyttää ModelingService-serviceä datan normalisointiin
- Lomakehaku tyhjentää kentät ja palauttaa alkuperäisen listan

## Sovelluksen käyttäjäpolku

### Home-komponentti:

Käyttäjä näkee keskeneräiset dokumentit ja voi ladata uusia. Admin näkee kaikki dokumentit, tavallinen käyttäjä vain omansa.

### InspectDocument-komponentti:

Käyttäjä klikkaa dokumenttia Home- tai DocumentList-näkymästä → siirtyy tarkastelemaan ja muokkaamaan tuoterivejä.

### DocumentList-komponentti:

Käyttäjä voi hakea valmiita dokumentteja, selata niitä ja siirtyä InspectDocument-näkymään tarvittaessa.
