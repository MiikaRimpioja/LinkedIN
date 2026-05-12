const createPool = require("./db_pool");

const saveDocumentData = async (
  documentId,
  productsArray,
  senders = [],
  receivers = [],
  orders = [],
  senderName
) => {
  const pool = await createPool();

  // Varmistetaan että kaikki parametrit ovat taulukoita
  if (
    !Array.isArray(productsArray) ||
    !Array.isArray(senders) ||
    !Array.isArray(receivers) ||
    !Array.isArray(orders)
  ) {
    throw new Error(
      `saveDocumentData: Odotettiin taulukkomuotoista dataa lähettäjille, vastaanottajille, tilauksille ja tuotteille.`
    );
  }

  try {
    // Päivitetään lähettäjän nimi documents-tauluun
    if (senderName) {
      await pool.execute(`UPDATE documents SET sender = ? WHERE id = ?`, [
        senderName,
        documentId,
      ]);
    }

    // Lisätään lähettäjät senders-tauluun
    for (const sender of senders) {
      await pool.execute(
        `INSERT INTO senders (document_id, company, contact_person, address, city, postal_code, country)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          documentId,
          sender.company ?? null,
          sender.contact_person ?? null,
          sender.address ?? null,
          sender.city ?? null,
          sender.postal_code ?? null,
          sender.country ?? null,
        ]
      );
    }

    // Lisätään vastaanottajat receivers-tauluun
    for (const receiver of receivers) {
      await pool.execute(
        `INSERT INTO receivers (document_id, contact_person, address, city, postal_code, country)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          documentId,
          receiver.contact_person ?? null,
          receiver.address ?? null,
          receiver.city ?? null,
          receiver.postal_code ?? null,
          receiver.country ?? null,
        ]
      );
    }

    // Lisätään tilaukset orders-tauluun
    for (const order of orders) {
      await pool.execute(
        `INSERT INTO orders (document_id, sales_order_number, package_number, order_date, shipping_date)
         VALUES (?, ?, ?, ?, ?)`,
        [
          documentId,
          order.sales_order_number ?? null,
          order.package_number ?? null,
          order.order_date ?? null,
          order.shipping_date ?? null,
        ]
      );
    }

    // Lisätään tuoterivit product_lines-tauluun
    for (const product of productsArray) {
      const { product_name, code, ordered_quantity, shipped_quantity, note } =
        product;

      await pool.execute(
        `INSERT INTO product_lines (document_id, product_name, code, ordered_quantity, shipped_quantity, note)
   VALUES (?, ?, ?, ?, ?, ?)`,
        [
          documentId,
          String(product_name ?? ""),
          String(code ?? ""),
          Number(ordered_quantity ?? null),
          Number(shipped_quantity ?? null),
          note ?? null,
        ]
      );
    }

    // Palautetaan yhteenveto tallennetuista riveistä
    return {
      status: "OK",
      inserted_senders: senders.length,
      inserted_receivers: receivers.length,
      inserted_orders: orders.length,
      inserted_products: productsArray.length,
    };
  } catch (err) {
    console.error("Virhe tietojen tallennuksessa:", err.message);
    throw new Error("Tietokantavirhe: " + err.message);
  }
};

module.exports = saveDocumentData;
