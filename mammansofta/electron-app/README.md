# Mammansofta

Työpöytäsovellus Windows käyttöjärjestelmälle.

Ohjelman tarkoitus on mahdollistaa yksinkertainen asiakasraportointi perhehoivakodille. Pääasiallinen tarkoitus on luoda automaattisesti kalenteri, johon voi merkata (napauttamalla solua) minä päivinä kukin asiakas on tulossa hoitoon. Lisäksi asiakkaita täytyy pystyä lisäämään ja poistamaan tarpeen mukaan sekä tulostamaan täytetty lista. 

Sovellus on toteutettu Electron sovelluksena Svelte frameworkillä. Sovellus tarjoillaan asiakkaille squirrel installerin avulla (tätä ei näy tässä repossa installerin suuren koon vuoksi).


Alla vielä ohjeet kuinka projektin käyttö onnistuu.

# electron-app

An Electron application with Svelte

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
