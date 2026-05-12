/// <reference types="cypress" />

/**
 * LOMAKKEIDEN TESTAUSAPUFUNKTIOT
 * Sisältää Cypress helper-funktiot lomakkeiden testaukseen
 */

/**
 * Täyttää tuoterivion kentät
 * @param rowIndex - Tuoterivin indeksi (0-based)
 * @param data - Objekti kentistä: { code?, ordered_qty?, shipped_qty?, note? }
 * @example fillProductRow(0, { code: 'TEST-001', ordered_qty: '10', shipped_qty: '10' })
 */
export function fillProductRow(
  rowIndex: number,
  data: { code?: string; ordered_qty?: string; shipped_qty?: string; note?: string }
) {
  const rowSelector = `.tuote-div:nth-child(${rowIndex + 1})`;

  if (data.code !== undefined) {
    cy.get(`${rowSelector} .input-field-text`).first().clear().type(data.code, { delay: 50 });
  }

  if (data.ordered_qty !== undefined) {
    cy.get(`${rowSelector} .input-field-qty`).eq(0).clear().type(data.ordered_qty, { delay: 50 });
  }

  if (data.shipped_qty !== undefined) {
    cy.get(`${rowSelector} .input-field-qty`).eq(1).clear().type(data.shipped_qty, { delay: 50 });
  }

  if (data.note !== undefined) {
    cy.get(`${rowSelector} textarea`).clear().type(data.note, { delay: 50 });
  }
}

/**
 * Validoi kentän arvon
 * @param fieldSelector - CSS-valitsija kenttään
 * @param expectedValue - Odotettu arvo
 * @example validateFormField('.input-field-text', 'TEST-001')
 */
export function validateFormField(fieldSelector: string, expectedValue: string) {
  cy.get(fieldSelector, { timeout: 6000 }).invoke('val').should('eq', expectedValue);
}

/**
 * Lähettää lomakkeen (klikkaa "Lähetä"-painiketta)
 * @example submitForm()
 */
export function submitForm() {
  cy.get('button.btn-send', { timeout: 6000 }).scrollIntoView().click({ force: true });
}

/**
 * Avaa PDF-modaalin
 * @example openPDFModal()
 */
export function openPDFModal() {
  cy.get('button.btn-show-modal', { timeout: 6000 }).scrollIntoView().click({ force: true });
}

/**
 * Sulkee PDF-modaalin
 * @example closePDFModal()
 */
export function closePDFModal() {
  // Yritä sulkea painikkeesta
  cy.get('app-modal .btn-back', { timeout: 6000 }).click({ force: true });
  // Fallback: jos vielä auki, klikkaa overlayta
  cy.get('body').then(($body) => {
    if ($body.find('app-modal').length > 0) {
      cy.get('app-modal ~ .modal-overlay, app-modal .modal-overlay', { timeout: 2000 })
        .first()
        .click({ force: true });
    }
  });
}

/**
 * Tarkista että modaali on auki
 * @example checkModalOpen()
 */
export function checkModalOpen() {
  cy.get('.modal-on', { timeout: 6000 }).should('exist');
  // Odota että modaali on renderöitynyt
  cy.wait(500);
}

/**
 * Tarkista että modaali on suljettu
 * @example checkModalClosed()
 */
export function checkModalClosed() {
  // Sulkeutumisessa voi olla animaatio -> käytä pidempää timeouttia ja tarkista sekä app-modal että .modal-on
  cy.get('app-modal', { timeout: 6000 }).should('not.exist');
  cy.get('.modal-on', { timeout: 6000 }).should('not.exist');
}

/**
 * Tyhjää tuoterivin kaikki kentät
 * @param rowIndex - Tuoterivin indeksi
 * @example clearProductRow(0)
 */
export function clearProductRow(rowIndex: number) {
  const rowSelector = `.tuote-div:nth-child(${rowIndex + 1})`;

  cy.get(`${rowSelector} input[type="text"]`).clear();
  cy.get(`${rowSelector} input[type="number"]`).clear();
  cy.get(`${rowSelector} textarea`).clear();
}

/**
 * Tarkista että kaikki tuoteirivit ovat olemassa
 * @param expectedCount - Odotettu tuoterivien määrä
 * @example checkProductRowCount(3)
 */
export function checkProductRowCount(expectedCount: number) {
  cy.get('.tuote-div', { timeout: 6000 }).should('have.length', expectedCount);
}

/**
 * Tarkista tuoterivin nimen arvo
 * @param rowIndex - Tuoterivin indeksi
 * @param expectedName - Odotettu nimi
 * @example checkProductName(0, 'Widget')
 */
export function checkProductName(rowIndex: number, expectedName: string) {
  const rowSelector = `.tuote-div:nth-child(${rowIndex + 1})`;
  cy.get(`${rowSelector} .tuote-nimi`, { timeout: 6000 }).should('have.text', expectedName);
}

/**
 * Tarkista että kenttä on kirjoituskelpoinen
 * @param fieldSelector - CSS-valitsija kenttään
 * @example checkFieldEditable('.input-field-text')
 */
export function checkFieldEditable(fieldSelector: string) {
  cy.get(fieldSelector, { timeout: 6000 }).should('not.be.disabled');
}

/**
 * Tarkista että kenttä on pois käytöstä
 * @param fieldSelector - CSS-valitsija kenttään
 * @example checkFieldDisabled('.input-field-text')
 */
export function checkFieldDisabled(fieldSelector: string) {
  cy.get(fieldSelector, { timeout: 6000 }).should('be.disabled');
}

/**
 * Tarkista että painike on näkyvä (käyttää scrollIntoView)
 * @example checkSubmitButtonVisible()
 */
export function checkSubmitButtonVisible() {
  cy.get('button.btn-send', { timeout: 6000 }).scrollIntoView().should('exist');
}

/**
 * Tarkista että "Dokumentti"-painike on näkyvä
 * @example checkDocumentButtonVisible()
 */
export function checkDocumentButtonVisible() {
  cy.get('button.btn-show-modal', { timeout: 6000 }).scrollIntoView().should('exist');
}

/**
 * Täytä satunnaisella datalla tuoterivin
 * @param rowIndex - Tuoterivin indeksi
 * @example fillProductRowWithRandomData(0)
 */
export function fillProductRowWithRandomData(rowIndex: number) {
  const randomCode = `TEST-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const randomQty = Math.floor(Math.random() * 100) + 1;

  fillProductRow(rowIndex, {
    code: randomCode,
    ordered_qty: randomQty.toString(),
    shipped_qty: randomQty.toString(),
    note: `Test note ${Date.now()}`,
  });
}

/**
 * Tarkista tuoterivin koodi-kenttä
 * @param rowIndex - Tuoterivin indeksi
 * @param expectedCode - Odotettu koodi
 * @example checkProductCode(0, 'TEST-001')
 */
export function checkProductCode(rowIndex: number, expectedCode: string) {
  const rowSelector = `.tuote-div:nth-child(${rowIndex + 1})`;
  cy.get(`${rowSelector} .input-field-text`, { timeout: 6000 })
    .first()
    .invoke('val')
    .should('eq', expectedCode);
}
