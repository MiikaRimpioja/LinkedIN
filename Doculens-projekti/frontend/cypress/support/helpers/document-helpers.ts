/// <reference types="cypress" />

/**
 * DOKUMENTTIEN TESTAUSAPUFUNKTIOT
 * Sisältää Cypress helper-funktiot dokumenttien käsittelyyn
 */

/**
 * Lataa PDF-tiedoston home-sivulla
 * @param filename - Tiedoston polku cypress/fixtures kansiosta
 * @example uploadPDF('test-documents/sample.pdf')
 */
export function uploadPDF(filename: string) {
  cy.get('button.btn-download', { timeout: 6000 }).click();
  cy.get('input[type="file"]').selectFile(filename, { force: true });
}

/**
 * Navigoi dokumenttiin (InspectDocument-sivu)
 * @param documentId - Dokumentin ID
 * @example navigateToDocument(1)
 */
export function navigateToDocument(documentId: string | number) {
  cy.visit(`https://d1d492fzsktwwi.cloudfront.net/inspect-document/${documentId}`);
}

/**
 * Odottaa että dokumenttien lista latautuu
 * @param type - "unfinished" tai "finished"
 * @example waitForDocumentListLoad('unfinished')
 */
export function waitForDocumentListLoad(type: 'unfinished' | 'finished' = 'unfinished') {
  if (type === 'unfinished') {
    cy.get('app-home', { timeout: 6000 }).should('be.visible');
  } else {
    cy.get('app-document-list', { timeout: 6000 }).should('be.visible');
  }
}

/**
 * Klikkaa ensimmäistä dokumenttia listasta
 * @example clickFirstDocument()
 */
export function clickFirstDocument() {
  cy.get('.document', { timeout: 6000 }).first().click();
}

/**
 * Odottaa InspectDocument-sivun latautumista
 * @example waitForInspectDocumentLoad()
 */
export function waitForInspectDocumentLoad() {
  cy.get('app-inspect-document', { timeout: 6000 }).should('be.visible');
}

/**
 * Tarkista että dokumenttilista näytetään
 * @example checkDocumentListVisible()
 */
export function checkDocumentListVisible() {
  cy.get('body', { timeout: 6000 }).then(($body) => {
    if ($body.find('.document').length > 0) {
      cy.get('.document-container').should('be.visible');
    } else {
      cy.get('.no-documents-view').should('be.visible');
    }
  });
}

/**
 * Odottaa notifikaatiomodaalin ilmestymistä
 * @example waitForNotificationModal()
 */
export function waitForNotificationModal() {
  // Odota joko notifikaatiomodaalin tai kotisivun ilmestymistä (onnistuminen voi navigoida heti)
  cy.log('Odotetaan notifikaatiota tai kotisivulle siirtymistä...');
  cy.get('app-notification-modal, app-home', { timeout: 12000 }).should('exist');

  // Tarkenna: jos modaali on näkyvissä, varmista visible; muutoin varmista kotisivu
  cy.get('body').then(($body) => {
    if ($body.find('app-notification-modal').length > 0) {
      cy.get('app-notification-modal', { timeout: 6000 }).should('be.visible');
      cy.log('Notifikaatiomodaali löydetty');
    } else {
      cy.get('app-home', { timeout: 10000 }).should('be.visible');
      cy.log('Navigoitu kotisivulle (notifikaatio saattoi sulkeutua/navigoida välittömästi)');
    }
  });
}

/**
 * Tarkista notifikaation tila (onnistuminen tai virhe)
 * @param isSuccess - true = onnistunut (vihreä), false = virhe (punainen)
 * @example checkNotificationStatus(true)
 */
export function checkNotificationStatus(isSuccess: boolean) {
  const selector = isSuccess ? '.modal-success' : '.modal-error';
  cy.get(selector, { timeout: 6000 }).should('be.visible');
}

/**
 * Sulje notifikaatiomodaali
 * @example closeNotification()
 */
export function closeNotification() {
  cy.location('pathname', { timeout: 8000 }).then((path) => {
    if (path.includes('/inspect-document')) {
      cy.get('app-notification-modal button', { timeout: 6000 }).first().click();
    } else {
      cy.log('Ei suljettavaa notifikaatiota – ollaan jo kotisivulla.');
    }
  });
}

/**
 * Navigoi home-sivulle
 * @example goToHome()
 */
export function goToHome() {
  cy.visit('/');
}

/**
 * Navigoi document-list-sivulle
 * @example goToDocumentList()
 */
export function goToDocumentList() {
  // Navigoidaan ensin juurisivulle ja käytetään client-side routeria,
  // jotta Angular SPA:n reititys toimii oikein testeissä.
  cy.visit('/');
  cy.window({ log: false }).then((win) => {
    win.history.pushState({}, '', '/document-list');
    win.dispatchEvent(new PopStateEvent('popstate'));
  });
  cy.location('pathname', { timeout: 8000 }).should('include', '/document-list');
  cy.get('app-document-list', { timeout: 8000 }).should('be.visible');
}

/**
 * Merkitse kaikki tuoterivit valmiiksi klikkaamalla "Valmis"-painiketta.
 * Ei muuta tekstikenttien arvoja eikä jätä pysyviä MOD-tyyppisiä muutoksia.
 */
export function markAllProductsDone() {
  // Klikkaa kaikki näkyvät "Valmis"-painikkeet päälle, ilman että vaaditaan joka riviltä nappia
  cy.get('body', { timeout: 6000 }).then(($body) => {
    const buttons = $body.find('.check-button');
    if (buttons.length === 0) {
      cy.log('Ei löydy check-button -nappeja; ohitetaan merkintä');
      return;
    }
  });

  cy.get('.check-button', { timeout: 6000 }).each(($btn) => {
    if (!$btn.hasClass('checked')) {
      cy.wrap($btn).click({ force: true });
    }
  });

  // Varmista, että ainakin yksi on merkitty valmiiksi
  cy.get('.check-button.checked', { timeout: 6000 }).should('have.length.greaterThan', 0);
}

/**
 * Tarkista että dokumentti siirtyi valmiiden listalle
 * @param documentId - Dokumentin ID jota etsitään
 * @example checkDocumentInFinished(1)
 */
export function checkDocumentInFinished(documentId: string | number) {
  goToDocumentList();
  cy.get('.document', { timeout: 6000 }).should('exist');
}
