/// <reference types="cypress" />

/**
 * INSPECT-DOCUMENT-SIVU TESTIT
 * Testaa InspectDocument-sivun (dokumentin muokkaus) toiminnallisuutta
 * - Dokumentin sisällön lataus
 * - Tuoterivien muokkaus
 * - PDF-modaalin avaaminen
 * - Tietojen lähettäminen
 * - Notifikaatiomodaalissa näytettävät viestit
 */
describe('InspectDocument-sivu (dokumentin muokkaus)', () => {
  const docsFixture = [
    {
      id: 1,
      filename: 'cypresstest.pdf',
      sender: 'cypressTestCo',
      upload_date: '2025-01-01T00:00:00.000Z',
      pallet: 101,
    },
  ];
  const productRowsFixture = [
    {
      product_line_id: 1,
      product_name: 'Cypress',
      code: 'cypressP-A-001',
      ordered_quantity: 10,
      shipped_quantity: 10,
      note: 'Row A',
      other_codes: [{ code_value: 'cypressPA-ALT' }],
      checked: false,
    },
    {
      product_line_id: 2,
      product_name: 'Cypress Prod B',
      code: 'cypressP-B-002',
      ordered_quantity: 20,
      shipped_quantity: 20,
      note: 'Row B',
      other_codes: [],
      checked: false,
    },
  ];

  function stubAll() {
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
    cy.intercept('GET', '/api/keskeneraiset', { statusCode: 200, body: docsFixture }).as(
      'getUnfinished'
    );
    cy.intercept('GET', '/api/keskeneraiset/1', {
      statusCode: 200,
      body: {
        id: 1,
        sender: { company: 'TestCo' },
        products: productRowsFixture,
      },
    }).as('getSpecificDocument');
    
    cy.intercept('GET', '/api/keskeneraiset/pdf/1', {
      statusCode: 200,
      body: new Blob([], { type: 'application/pdf' }),
    }).as('getPdf');
  }

  beforeEach(() => {
    stubAll();
    cy.visit('/');
    cy.wait(['@getEndpoints', '@getUnfinished']);
    cy.get('.user-change', { timeout: 6000 }).click();
    // Odota että container ilmestyy ennen dokumentin klikkausta
    cy.get('.document-container', { timeout: 6000 }).should('exist');
    cy.get('.document', { timeout: 6000 }).first().click();
    cy.wait(['@getSpecificDocument', '@getPdf']);
    cy.url({ timeout: 6000 }).should('include', '/inspect-document/1');
    cy.get('app-inspect-document', { timeout: 6000 }).should('be.visible');
  });

  it('2.1 Sivu latautuu onnistuneesti', () => {
    // Tarkista pääkomponentti
    cy.get('app-inspect-document', { timeout: 6000 }).should('exist');
    cy.get('.tuote-container').should('be.visible');
  });

  it('2.2 Otsikko näyttää yrityksen nimen', () => {
    cy.get('h2[data-testid="otsikko"]', { timeout: 6000 })
      .should('be.visible')
      .invoke('text')
      .should('include', 'TestCo');
  });

  it('2.3 Tuoterivit näytetään', () => {
    cy.get('.tuote-div', { timeout: 6000 }).should('have.length', productRowsFixture.length);
  });

  it('2.4 Ensimmäisen tuoterivin nimi näkyy', () => {
    cy.get('.tuote-nimi', { timeout: 6000 })
      .first()
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.equal('Cypress');
      });
  });

  it('2.5 Koodi-kenttä on muokattavissa', () => {
    cy.get('.input-field-text', { timeout: 6000 })
      .first()
      .clear()
      .type('TEST-CODE-123', { delay: 0 });
    cy.get('.input-field-text').first().invoke('val').should('eq', 'TEST-CODE-123');
  });

  it('2.6 Määrä-kenttä on muokattavissa', () => {
    cy.get('.input-field-qty', { timeout: 6000 }).first().clear().type('5', { delay: 0 });
    cy.get('.input-field-qty').first().invoke('val').should('eq', '5');
  });

  it('2.7 "Dokumentti"-painike on näkyvä', () => {
    // Tarkista dokumentti-painikkeen näkyvyys
    cy.get('button.btn-show-modal', { timeout: 6000 }).should('be.visible');
    cy.get('button.btn-show-modal').should('contain', 'Dokumentti');
  });

  it('2.8 "Lähetä"-painike on näkyvä', () => {
    // Tarkista lähetä-painikkeen näkyvyys
    cy.get('button.btn-send', { timeout: 6000 }).should('be.visible');
    cy.get('button.btn-send').should('contain', 'Lähetä');
  });

  it('2.9 "Dokumentti"-painike avaa PDF-modaalin', () => {
    cy.get('button.btn-show-modal', { timeout: 6000 }).click();
    cy.get('app-modal', { timeout: 6000 }).should('exist');
    // Riittää että overlay-elementti renderöityy
    cy.get('.modal-on', { timeout: 6000 }).should('exist');
  });

  it('2.10 PDF-modaali voidaan sulkea', () => {
    cy.get('button.btn-show-modal').click();
    cy.get('app-modal').should('exist');
    cy.get('app-modal .btn-back', { timeout: 6000 }).click();
    cy.get('app-modal').should('not.exist');
  });

  it('2.11 Virheellinen lähetys näyttää error-luokan', () => {
   
    stubAll();
    cy.visit('/');
    cy.wait(['@getEndpoints', '@getUnfinished']);
    cy.get('.user-change').click();
    cy.get('.document').first().click();
    cy.wait(['@getSpecificDocument', '@getPdf']);
 
    cy.get('.check-button').each(($btn) => {
      if (!$btn.hasClass('checked')) cy.wrap($btn).click();
    });
    cy.intercept('POST', '/api/valmiit', { statusCode: 500, body: { error: 'fail' } }).as(
      'postFail'
    );
    cy.get('button.btn-send').click();
    cy.wait('@postFail');
    cy.get('app-notification-modal').should('exist');
    cy.get('.modal-container').should('have.class', 'error');
  });

  it('2.12 Virhemodaali sulkeutuu OK-painikkeella', () => {
  
    stubAll();
    cy.visit('/');
    cy.wait(['@getEndpoints', '@getUnfinished']);
    cy.get('.user-change').click();
    cy.get('.document').first().click();
    cy.wait(['@getSpecificDocument', '@getPdf']);
    cy.get('.check-button').each(($btn) => {
      if (!$btn.hasClass('checked')) cy.wrap($btn).click();
    });
    cy.intercept('POST', '/api/valmiit', { statusCode: 500, body: { error: 'fail' } }).as(
      'postFail2'
    );
    cy.get('button.btn-send').click();
    cy.wait('@postFail2');
    cy.get('app-notification-modal').should('exist');
    cy.get('.btn-ok', { timeout: 6000 }).click();
    cy.get('app-notification-modal').should('not.exist');
  });
});
