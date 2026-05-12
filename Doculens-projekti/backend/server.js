const express = require("express");
const app = express();
const cors = require("cors");
const upload_pdf = require("./upload/upload_handler");
const share_endpoints = require("./utils/get_endpoints");
const authMiddleware = require("./utils/auth");
const getIncompleteFiles = require("./database/db_pending");
const getProducts = require("./database/db_pending_id");
const update_field = require("./database/db_update_field");
const downloadPDF = require("./download/download_handler");
const getProcessed = require("./database/db_processed");
const getSearchResults = require("./database/db_search");

// Portti, jolla palvelin kuuntelee (lisää tähän portin haku aws secrests managerista)
const PORT = 3000;

// Middlewaret
app.use(cors({ origin: "https://d1d492fzsktwwi.cloudfront.net" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send({ message: "Server is running" });
});

// Endpoint keskeneräisen tiedoston tuoterivien hakemiseksi
app.get("/api/keskeneraiset/:id", authMiddleware, getProducts);
//  Endpoint keskeneräisten tiedostojen hakemiseksi
app.get("/api/keskeneraiset", authMiddleware, getIncompleteFiles);
//  Endpoint tarkistetun tiedon päivittämiseksi
app.post("/api/update/field", authMiddleware, update_field);
// Endpoint käsiteltyjen tiedostojen hakemiseksi
app.get("/api/update/field", authMiddleware, getProcessed);
// Endpoint tiedoston lataamiseksi
app.post("/api/upload/pdf", authMiddleware, upload_pdf);
// Endpoint kaikkien saatavilla olevien endpointien listaamiseksi
app.get("/api/endpoints", authMiddleware, share_endpoints);
// Endpoint PDF-tiedoston lataamiseksi
app.get("/api/download/pdf/:id", authMiddleware, downloadPDF);
// Endpoint käsiteltyjen tiedostojen hakemiseksi hakupalkin kautta
app.get("/api/processed/search", authMiddleware, getSearchResults);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
