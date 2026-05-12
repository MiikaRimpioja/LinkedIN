const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const getAwsRegion = require("../utils/get_region");

// Normalisoi Claude:n palauttaman JSON-rakenteen
function normalizePackingSlip(raw) {
  const sender = raw.lahettaja || raw.lähettäjä || raw.sender || {};
  const receiver = raw.vastaanottaja || raw.receiver || {};
  const order = raw.tilaus || raw.order || {};
  const products = Array.isArray(raw.tuotteet || raw.items)
    ? raw.tuotteet || raw.items
    : [];

  return {
    sender: {
      company: sender.yritys ?? sender.company ?? null,
      contact_person: sender.yhteyshenkilo ?? sender.contact_person ?? null,
      address: sender.osoite ?? sender.address ?? null,
      city: sender.kaupunki ?? sender.city ?? null,
      postal_code: sender.postinumero ?? sender.postal_code ?? null,
      country: sender.maa ?? sender.country ?? null,
    },
    receiver: {
      contact_person: receiver.yhteyshenkilo ?? receiver.contact_person ?? null,
      address: receiver.osoite ?? receiver.address ?? null,
      city: receiver.kaupunki ?? receiver.city ?? null,
      postal_code: receiver.postinumero ?? receiver.postal_code ?? null,
      country: receiver.maa ?? receiver.country ?? null,
    },
    order: {
      sales_order_number:
        order.myyntitilaus ?? order.sales_order_number ?? null,
      package_number: order.paketti ?? order.package_number ?? null,
      order_date: order.tilausaika ?? order.order_date ?? null,
      shipping_date: order.lahetysaika ?? order.shipping_date ?? null,
    },
    items: products.map((tuote) => ({
      product_name: tuote.nimi ?? tuote.name ?? null,
      code: tuote.koodi ?? tuote.code ?? null,
      ordered_quantity: tuote.tilattu_maara ?? tuote.ordered_quantity ?? null,
      shipped_quantity:
        tuote.lahetetty_maara ?? tuote.shipped_quantity ?? tuote.maara ?? null,
      note: tuote.huomio ?? tuote.note ?? null,
    })),
  };
}

// Käytetään Claude-mallia OCR-tekstin jäsentämiseen
async function parseWithClaude(ocrText, language = "fi") {
  const REGION = await getAwsRegion();
  const MODEL_ID = "eu.anthropic.claude-haiku-4-5-20251001-v1:0";

  const client = new BedrockRuntimeClient({ region: REGION });

  const prompt =
    language === "fi"
      ? `Tässä on OCR-teksti suomalaisesta lähetyslistasta. Palauta se JSON-rakenteena, jossa on seuraavat kentät:

- sender: company, contact_person, address, postal_code, city, country
- receiver: contact_person, address, postal_code, city, country
- order: sales_order_number, package_number, order_date, shipping_date
- items: taulukko, jossa jokaisessa tuotteessa on name, code, ordered_quantity, shipped_quantity, note

Ohjeita:
- Yritä korjata ilmeiset OCR-virheet, kuten "0" vs "O", "1" vs "l", "u" vs "v", rivinvaihdot keskellä sanoja jne.
- Korjaa kirjoitusvirheet erityisesti tuotenimissä ja osoitteissa käyttämällä suomen kielen tuntemusta ja yleisiä sanoja.
- Hyödynnä suomen kielen sanastoa ja yleisiä lähetyslistoilla esiintyviä sanoja virheiden korjaamiseen.
- Jos sana näyttää virheelliseltä mutta muistuttaa tunnettua suomenkielistä sanaa (esim. "Ruvvilaatikko" → "Ruuvilaatikko"), korjaa se.
- Jos löytyy vain "määrä", laita se shipped_quantity-kenttään.
- Jos kenttä puuttuu, aseta sen arvoksi null.
- Jos tuoterivit ovat katkenneet usealle riville, yhdistä ne järkevästi.
- Erota tuotteet toisistaan rivinvaihtojen tai tunnisteiden (esim. tuotekoodi) perusteella.
- Käytä suomalaisten lähetyslistojen yleistä rakennetta apuna kenttien tunnistamisessa.


Palauta vain JSON ilman selityksiä tai muotoilua.

OCR-teksti alkaa seuraavalla rivillä:
===
${ocrText}
===
`
      : `Here is OCR text from an English-language packing slip. Return it as structured JSON with the following fields:

- sender: company, contact_person, address, postal_code, city, country
- receiver: contact_person, address, postal_code, city, country
- order: sales_order_number, package_number, order_date, shipping_date
- items: array of products, each with name, code, ordered_quantity, shipped_quantity, note

Instructions:
- Correct common OCR errors such as "0" vs "O", "1" vs "l", "u" vs "v", and broken words across line breaks.
- Fix spelling mistakes especially in product names and addresses using knowledge of English vocabulary and common packing slip terminology.
- If a word appears misspelled but resembles a known English word (e.g. "Screvvdriver" → "Screwdriver"), correct it.
- Use context and typical packing slip structure to identify and correct fields.
- If only one quantity is found, assign it to shipped_quantity.
- If any field is missing, set its value to null.
- If product rows are split across multiple lines, merge them logically.
- Separate products based on line breaks or identifiers (e.g. product code).

Return only JSON without explanations or formatting.

OCR text starts below:
===
${ocrText}
===

`;

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1524,
  };

  const command = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  try {
    const response = await client.send(command);
    const raw = new TextDecoder().decode(response.body);

    let message;
    try {
      message = JSON.parse(raw);
    } catch (jsonErr) {
      console.error("Claude returned non-JSON response:", raw);
      throw new Error("Claude returned non-JSON response", jsonErr);
    }

    const textBlock = message?.content?.[0]?.text;
    if (!textBlock || typeof textBlock !== "string") {
      throw new Error("Claude response missing expected text block");
    }

    const jsonText = textBlock
      .replace(/^```json\n/, "")
      .replace(/```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (jsonErr) {
      console.error("Claude returned invalid JSON:", jsonText);
      throw new Error("Claude returned invalid JSON", jsonErr);
    }

    const normalized = normalizePackingSlip(parsed);
    return { parsed, normalized };
  } catch (err) {
    console.error("Claude parsing failed:", err);
    throw new Error("Claude parsing failed: " + err.message);
  }
}

module.exports = parseWithClaude;
