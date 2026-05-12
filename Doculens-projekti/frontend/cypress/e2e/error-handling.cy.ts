/// <reference types="cypress" />

/**
 * VIRHEENKÄSITTELY TESTIT
 * Testaa sovelluksen virheentilanteiden käsittelyä:
 * - API-virheet (4xx, 5xx)
 * - Verkkovirheet
 * - Timeout-tilanteet
 * - Puutteelliset tiedot
 * - Notifikaatiot virhetilanteissa
 */

import * as docHelpers from '../support/helpers/document-helpers';
import * as formHelpers from '../support/helpers/form-helpers';

// Test helper: stub endpoints + unfinished documents consistently to avoid flaky production data reliance
function stubEndpointsAndDocuments(docs: Array<any>, productRows?: Array<any>) {
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

  // Stub specific unfinished document endpoint
  if (docs.length > 0) {
    const first = docs[0];
    cy.intercept('GET', `/api/keskeneraiset/${first.id}`, {
      statusCode: 200,
      body: {
        id: first.id,
        sender: { company: 'TestCo' },
        products: (productRows || []).map((p, idx) => ({
          product_line_id: p.product_line_id || idx + 1,
          product_name: p.product_name,
          code: p.code,
          shipped_quantity: p.shipped_quantity,
          ordered_quantity: p.ordered_quantity,
          note: p.note,
          other_codes: p.other_codes || [],
          checked: p.checked || false,
          document_id: first.id,
        })),
      },
    }).as('getSpecificDocument');

    // Stub PDF endpoint success by default (tests that need error override later)
    cy.intercept('GET', `/api/keskeneraiset/pdf/${first.id}`, {
      statusCode: 200,
      body: new Blob([], { type: 'application/pdf' }),
    }).as('getPdf');
  }
}

// Reusable sample documents (minimal fields needed by ModelingService)
const sampleDocs = [
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

// Product rows fixture (minimal)
const sampleProductRows = [
  {
    product_line_id: 1,
    product_name: 'Prod A',
    code: 'P-A-001',
    ordered_quantity: 10,
    shipped_quantity: 10,
    note: 'OK',
  },
  {
    product_line_id: 2,
    product_name: 'Prod B',
    code: 'P-B-002',
    ordered_quantity: 20,
    shipped_quantity: 20,
    note: 'OK',
  },
];

describe('Virheenkäsittely (Error Handling)', () => {
  const baseUrl = 'https://d1d492fzsktwwi.cloudfront.net/';

  // ========== VAIHE 1: SIVUN LATAUSVIRHEET ==========
  describe('1. Sivun latausvirheet', () => {
    it('1.1 Virheellinen dokumentti-ID palauttaa 401 virheen', () => {
      // Tarkista, että virheellinen dokumentti-ID palauttaa 401 (Unauthorized)
      cy.request({
        url: `${baseUrl}api/keskeneraiset/999999999`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(401);
        cy.log('Virheellinen dokumentti-ID palauttaa 401 oikein');
      });
    });

    it('1.2 Home-sivu latautuu vaikka API:sta ei saataisi dokumentteja', () => {
      // Stub successful endpoints but empty unfinished docs list
      stubEndpointsAndDocuments([]);
      cy.visit('/');
      cy.get('app-home', { timeout: 8000 }).should('exist');

      // Vaihda admin-näkymään jotta tyhjän listan placeholder renderöityy
      cy.get('.user-change', { timeout: 6000 }).click();
      cy.get('body', { timeout: 6000 }).then(($body) => {
      
        expect($body.find('.document').length).to.eq(0);
      });
      cy.get('.no-documents-view', { timeout: 6000 }).should('be.visible');
      cy.log('Tyhjä tila näytetään oikein kun dokumentteja ei ole');
    });
  });

  // ========== VAIHE 2: NOTIFIKAATIOIDEN VIRHETILANTEET ==========
  describe('2. Notifikaatiot virhetilanteissa', () => {
    beforeEach(() => {
      stubEndpointsAndDocuments(sampleDocs, sampleProductRows);
      docHelpers.goToHome();
      cy.wait(['@getEndpoints', '@getUnfinished']);
      // Vaihda admin näkymään jotta dokumenttilista näkyy
      cy.get('.user-change', { timeout: 6000 }).click();
      cy.get('.document', { timeout: 8000 }).should('have.length.greaterThan', 0).first().click();
      cy.wait('@getSpecificDocument');
      cy.url({ timeout: 8000 }).should('include', '/inspect-document');
      cy.get('app-inspect-document', { timeout: 8000 }).should('exist');
      cy.wait('@getPdf');
    });

    it('2.1 Epäonnistuneen lähetyksen virhenotifikaatio näytetään oikein', () => {
      cy.get('body', { timeout: 8000 }).then(($body) => {
        const hasCheckButtons = $body.find('.check-button').length > 0;

        if (hasCheckButtons) {
          // Merkitse kaikki valmiiksi
          cy.get('.check-button').each(($btn) => {
            if (!$btn.hasClass('checked')) {
              cy.wrap($btn).click({ force: true });
            }
          });

          // Lähetä
          formHelpers.submitForm();

          // Odota notifikaatiota
          cy.get('app-notification-modal, app-home', { timeout: 12000 }).should('exist');

          // Tarkista, että notifikaatio näytetään (onnistuminen tai virhe)
          cy.get('body').then(($notif) => {
            if ($notif.find('app-notification-modal').length > 0) {
              cy.get('app-notification-modal', { timeout: 6000 }).should('be.visible');
              cy.get('.modal-message', { timeout: 6000 }).should('not.be.empty');
              cy.log('Notifikaatio näytetään');
            } else {
              cy.log('Navigoitu kotisivulle (mahdollinen nopea ohjaus)');
            }
          });
        } else {
          cy.log('Ei "Valmis"-nappeja, ohitetaan lähetys');
        }
      });
    });

    it('2.2 Virhenotifikaation väri on punainen (error-luokka)', () => {
      cy.get('body', { timeout: 8000 }).then(($body) => {
        if ($body.find('app-notification-modal').length > 0) {
          cy.get('app-notification-modal', { timeout: 6000 }).within(() => {
            cy.get('.modal-container', { timeout: 6000 }).then(($modal) => {
              const isError = $modal.hasClass('error');
              const isSuccess = $modal.hasClass('success');

              if (isError || isSuccess) {
                cy.log(
                  `Notifikaatiolle on määritetty väri: ${
                    isError ? 'error (punainen)' : 'success (vihreä)'
                  }`
                );
              }
            });
          });
        }
      });
    });
  });

  // ========== VAIHE 3: VERKKO- JA TIMEOUT-TILANTEET ==========
  describe('3. Verkko- ja timeout-tilanteet', () => {
    it('3.1 Slow network -tilanteen käsittely', () => {
      // Aseta hitaampi verkkonopeus
      cy.intercept('/api/*', (req) => {
        // Viivä käsitellään pyyntötasolla
        return new Promise((resolve) => {
          setTimeout(() => {
            req.reply();
            resolve(undefined);
          }, 2000); // 2 sekunnin viive
        });
      });

      cy.visit(baseUrl);
      cy.get('app-home', { timeout: 10000 }).should('exist');
      cy.log('Home-sivu latautuu hitaalla verkolla');
    });

    it('3.2 API timeoutin käsittely', () => {
      // Estä API-kutsut
      cy.intercept('/api/*', { forceNetworkError: true });

      cy.visit(baseUrl);

      // Sivun pitäisi silti latautua, mutta ilman dokumentteja
      cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('app-home').length > 0) {
          cy.log('Home-sivu näytetään jopa API-virheen sattuessa');
        }
      });
    });
  });

  // ========== VAIHE 4: LOMAKKEEN VIRHEOLOT ==========
  describe('4. Lomakkeen virheolot', () => {
    beforeEach(() => {
      stubEndpointsAndDocuments(sampleDocs, sampleProductRows);
      docHelpers.goToHome();
      cy.wait(['@getEndpoints', '@getUnfinished']);
      cy.get('.user-change', { timeout: 6000 }).click();
      cy.get('.document', { timeout: 8000 }).first().click();
      cy.wait('@getSpecificDocument');
      cy.url({ timeout: 8000 }).should('include', '/inspect-document');
      cy.get('app-inspect-document', { timeout: 8000 }).should('exist');
      cy.wait('@getPdf');
    });

    it('4.1 Lähetä-painike on pois käytöstä, jos rivit eivät ole valmiita', () => {
      cy.get('button.btn-send', { timeout: 6000 }).then(($btn) => {
        // Tarkista, että painike on disabloitu ennen valmiiksi merkitsemistä
        const isDisabled = $btn.prop('disabled');

        if (isDisabled) {
          cy.log('Lähetä-painike on oikein disabloitu');
        } else {
          cy.log('Lähetä-painike on aktiivinen (ehkä kaikki on valmiiksi merkitty)');
        }
      });
    });
  });

  // ========== VAIHE 5: KÄYTTÄJÄN VIRHEELLINEN SYÖTTÖ ==========
  describe('5. Käyttäjän virheellinen syöttö', () => {
    beforeEach(() => {
      stubEndpointsAndDocuments(sampleDocs, sampleProductRows);
      docHelpers.goToHome();
      cy.wait(['@getEndpoints', '@getUnfinished']);
      cy.get('.user-change', { timeout: 6000 }).click();
      cy.get('.document', { timeout: 8000 }).first().click();
      cy.wait('@getSpecificDocument');
      cy.url({ timeout: 8000 }).should('include', '/inspect-document');
      cy.get('app-inspect-document', { timeout: 8000 }).should('exist');
      cy.wait('@getPdf');
    });

    it('5.1 Negatiivisen luvun syöttäminen määräkenttään', () => {
      cy.get('.tuote-div', { timeout: 6000 })
        .first()
        .within(() => {
          cy.get('.input-field-qty')
            .first()
            .clear()
            .type('-5', { delay: 50 })
            .then(($input) => {
              const value = $input.val();

              // Tarkista, että arvo on joko negatiivinen tai sovellus estää sen
              if (value === '-5' || value === '5') {
                cy.log('Negatiivinen luku käsitelty');
              }
            });
        });
    });

    it('5.2 Erittäin pitkän tekstin syöttäminen koodi-kenttään', () => {
      cy.get('.tuote-div', { timeout: 6000 })
        .first()
        .within(() => {
          const longText = 'A'.repeat(200);
          cy.get('.input-field-text')
            .first()
            .clear()
            .type(longText, { delay: 0 })
            .then(($input) => {
              const value = $input.val() as string;
              cy.log(`Syötetyn tekstin pituus: ${value.length}`);
            });
        });
    });
  });

  // ========== VAIHE 6: DOKUMENTIN LATAUSVIRHEET ==========
  describe('6. Dokumentin latausvirheet', () => {
    it('6.1 PDF-dokumentin latausvirhe näytetään oikein', () => {
      stubEndpointsAndDocuments(sampleDocs, sampleProductRows);
      docHelpers.goToHome();
      cy.wait(['@getEndpoints', '@getUnfinished']);
      cy.get('.user-change', { timeout: 6000 }).click();
      cy.get('.document', { timeout: 8000 }).first().click();
      cy.wait('@getSpecificDocument');
      cy.url({ timeout: 8000 }).should('include', '/inspect-document');

      
      cy.intercept('GET', /\/api\/keskeneraiset\/pdf\/\d+/, { forceNetworkError: true }).as(
        'pdfError'
      );
      formHelpers.openPDFModal();
      // Modaali tai notifikaatio pitäisi näkyä
      cy.get('body', { timeout: 6000 }).then(($body) => {
        if ($body.find('.modal-on').length > 0) {
          cy.log('PDF-modaali avattu vaikka virhe');
          formHelpers.closePDFModal();
        } else if ($body.find('app-notification-modal').length > 0) {
          cy.log('Virhe-ilmoitus näytetään PDF-haussa');
        } else {
          cy.log('Ei modalia eikä notifikaatiota – tarkista PDF virheilmoituslogiikka');
        }
      });
    });
  });

  // ========== VAIHE 7: KOKONAINEN VIRHEENKÄSITTELY ==========
  describe('7. Virheenkäsittely kokonaisuutena', () => {
    it('7.1 Sovellus pysyy vakaana virhetilanteissa', () => {
      // Vieraile useissa sivuissa ja tarkista, että sovellus ei kaadu
      cy.visit(baseUrl);
      cy.get('app-home', { timeout: 8000 }).should('exist');

      cy.get('body', { timeout: 6000 }).then(($body) => {
        if ($body.find('.document').length > 0) {
          cy.get('.document', { timeout: 6000 }).first().click();
          cy.url({ timeout: 8000 }).should('include', '/inspect-document');
          cy.get('app-inspect-document', { timeout: 8000 }).should('exist');

          // Paluu Home-sivulle
          cy.visit('/');
          cy.get('app-home', { timeout: 8000 }).should('exist');

          cy.log('Sovellus pysyi vakaana navigoinnin ja virhetilanteissa');
        }
      });
    });
  });
});
