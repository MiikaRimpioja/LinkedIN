/// <reference types="cypress" />

/**
 * HOME-SIVU TESTIT
 * Testaa Home-sivun (Keskeneräiset dokumentit) toiminnallisuutta
 * - PDF lataus
 * - Dokumenttilista
 * - Navigointi
 */
describe('Home-sivu (Keskeneräiset dokumentit)', () => {
  
  const docsFixture = [
    {
      id: 1,
      filename: 'doc_1.pdf',
      sender: 'TestCo',
      upload_date: '2025-01-01T00:00:00.000Z',
      pallet: 101,
    },
    {
      id: 2,
      filename: 'doc_2.pdf',
      sender: 'OrgB',
      upload_date: '2025-01-02T00:00:00.000Z',
      pallet: 202,
    },
  ];

  function stubHomeEndpoints(docs: any[]) {
    cy.intercept('GET', '/api/endpoints', {
      statusCode: 200,
      body: {
        upload_ocr: '/api/upload',
        kesken_url: '/api/keskeneraiset',
        keskenpdf_url: '/api/keskeneraiset/pdf',
        valmiit_url: '/api/valmiit',
        valmiit_haku_url: '/api/valmiithaku',
      },
    }).as('getEndpoints');
    cy.intercept('GET', '/api/keskeneraiset', {
      statusCode: 200,
      body: docs,
    }).as('getUnfinished');
  }

  // Ennen jokaista testiä: stub + visit + toggle admin jotta h1 ja lista näkyvät
  beforeEach(() => {
    stubHomeEndpoints(docsFixture);
    cy.visit('/');
    cy.wait(['@getEndpoints', '@getUnfinished']);
    // Vaihda admin näkymään (h1 ja dokumenttilista ovat admin-ehdon sisällä)
    cy.get('.user-change', { timeout: 6000 }).click();
  });

  it('1.1 Sivu latautuu onnistuneesti', () => {
    // Tarkista pääkomponentti ja säilö
    cy.get('app-root').should('exist');
    cy.get('.container').should('be.visible');
  });

  it('1.2 "Lataa PDF" -painike näkyy', () => {
    // Tarkista painikkeen näkyvyys ja teksti
    cy.get('button.btn-download').should('be.visible');
    cy.get('button.btn-download').should('contain', 'Lataa PDF');
  });

  it('1.3 PDF input-kenttä on piilotettu', () => {
    // File input pitäisi olla piilotettu
    cy.get('input[type="file"]').should('have.css', 'display', 'none');
  });

  it('1.4 H1-otsikko näyttää "Keskeneräiset"', () => {
    cy.get('h1.page-title', { timeout: 6000 }).should('have.text', 'Keskeneräiset');
  });

  it('1.5 Dokumenttilista tai "ei dokumentteja" -viesti näytetään', () => {
    cy.get('body', { timeout: 6000 }).then(($body) => {
      const docCount = $body.find('.document').length;
      if (docCount > 0) {
        cy.get('.document-container').should('be.visible');
        cy.log(`Ladattuja dokumentteja: ${docCount}`);
      } else {
        cy.get('.no-documents-view', { timeout: 6000 }).should('be.visible');
        cy.log('Tyhjä näkymä näytetään oikein');
      }
    });
  });

  it('1.6 Dokumenttia klikkaamalla navigoidaan InspectDocument-sivulle', () => {
    cy.get('.document', { timeout: 6000 }).first().click();
    cy.url({ timeout: 6000 }).should('include', '/inspect-document');
  });

  it('1.7 "Lataa PDF" -painike aktivoituu lavan numerosta ja avaa tiedoston valinnan', () => {
    // Syötä lavanumero jotta painike ei ole disabloitu
    cy.get('input.pallet-input', { timeout: 6000 }).type('123');
    cy.get('button.btn-download').should('not.be.disabled').click();
    cy.get('input[type="file"]').should('have.attr', 'accept', 'application/pdf');
  });
});
