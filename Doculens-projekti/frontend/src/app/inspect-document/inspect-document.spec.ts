import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { InspectDocument } from './inspect-document';

import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Api } from '../services/api_service';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

// InspectDocument-komponentin testit
describe('InspectDocument', () => {
  let component: InspectDocument;
  let fixture: ComponentFixture<InspectDocument>;
  let mockApiService: jasmine.SpyObj<Api>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    // Luodaan mockatut palvelut
    mockApiService = jasmine.createSpyObj('Api', [
      'getSpecificDocumentPDF',
      'getSpecificUnfinishedDocument',
      'updateDocument',
    ]);

    // Mockataan reitittäjä
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    // Asetetaan oletuspalautusarvot
    mockApiService.getSpecificDocumentPDF.and.returnValue(
      of(new Blob(['PDF'], { type: 'application/pdf' }))
    );
    mockApiService.getSpecificUnfinishedDocument.and.returnValue(
      of({
        id: 123,
        sender: { company: 'Yrityksen nimi' },
        products: [],
      })
    );

    await TestBed.configureTestingModule({
      imports: [InspectDocument],
      providers: [
        provideHttpClient(),
        ...provideHttpClientTesting(),
        { provide: Api, useValue: mockApiService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => {
                  if (key === 'id') return '123';
                  return null;
                },
              },
            },
          },
        },
        {
          provide: Router,
          useValue: mockRouter,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InspectDocument);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('showNotificationModal', () => {
    it('should set notification properties with success status', () => {
      component.showNotificationModal(true, 'Success message');
      expect(component.notificationStatus).toBe(true);
      expect(component.notificationMessage).toBe('Success message');
      expect(component.showNotification).toBe(true);
    });

    it('should set notification properties with error status', () => {
      component.showNotificationModal(false, 'Error message');
      expect(component.notificationStatus).toBe(false);
      expect(component.notificationMessage).toBe('Error message');
      expect(component.showNotification).toBe(true);
    });
  });

  describe('handleModalClose', () => {
    it('should hide notification modal', () => {
      component.showNotification = true;
      component.handleModalClose();
      expect(component.showNotification).toBe(false);
    });
  });

  describe('extractProductName', () => {
    it('should extract and format product name correctly', () => {
      const result = component.extractProductName('product name here');
      expect(result).toBe('Product');
    });

    it('should handle single word product name', () => {
      const result = component.extractProductName('product');
      expect(result).toBe('Product');
    });

    it('should return null for empty string', () => {
      const result = component.extractProductName('');
      expect(result).toBeNull();
    });

    it('should return null for falsy input', () => {
      const result = component.extractProductName(null as any);
      expect(result).toBeNull();
    });

    it('should uppercase first letter only', () => {
      const result = component.extractProductName('PRODUCT extra');
      expect(result).toBe('Product');
    });
  });

  describe('modelIncomingDocument', () => {
    it('should transform document data correctly', () => {
      const mockData = {
        id: 1,
        document_id: 100,
        product_name: 'Test Product',
        code: 'CODE123',
        ordered_quantity: 10,
        shipped_quantity: 8,
        note: 'Test note',
      };

      const result = (component as any).modelingService.modelProductRow(mockData);

      expect(result.product_line_id).toBeNull();
      expect(result.document_id).toBe(100);
      expect(result.product_name).toBe('Test Product');
      expect(result.code).toBe('CODE123');
      expect(result.ordered_quantity).toBe(10);
      expect(result.shipped_quantity).toBe(8);
      expect(result.note).toBe('Test note');
    });

    it('should handle missing fields with null defaults', () => {
      const mockData = {
        id: 1,
      };

      const result = (component as any).modelingService.modelProductRow(mockData);

      expect(result.product_line_id).toBeNull();
      expect(result.document_id).toBeNull();
      expect(result.product_name).toBeNull();
      expect(result.code).toBeNull();
    });
  });

  describe('ngOnInit', () => {
    // Testi PDF:n ja dokumentin lataamisen onnistumiselle
    it('should load PDF and document data on success', fakeAsync(() => {
      mockApiService.getSpecificDocumentPDF.and.returnValue(
        of(new Blob(['PDF'], { type: 'application/pdf' }))
      );
      mockApiService.getSpecificUnfinishedDocument.and.returnValue(
        of({
          id: 123,
          sender: { company: 'Test Company' },
          products: [
            {
              id: 1,
              product_name: 'test product',
              code: 'ABC123',
              ordered_quantity: 5,
              shipped_quantity: 3,
            },
          ],
        })
      );

      fixture.detectChanges();
      tick();

      // Varmistetaan että dokumentin tiedot on ladattu oikein
      expect(component.documentId).toBe('123');
      expect(component.company).toBe('Test Company');
      expect(component.tuoteRivit.length).toBe(1);
      expect(component.tuoteRivit[0].product_name).toBe('Test');
    }));

    it('should show notification on document fetch failure', fakeAsync(() => {
      // Simuloidaan API-virhe
      mockApiService.getSpecificUnfinishedDocument.and.returnValue(
        throwError(() => new Error('API error'))
      );
      spyOn(component, 'showNotificationModal');

      fixture.detectChanges();
      tick();

      expect(component.showNotificationModal).toHaveBeenCalledWith(
        false,
        'Dokumentin haku epäonnistui'
      );
    }));

    it('should handle PDF fetch error', fakeAsync(() => {
      mockApiService.getSpecificDocumentPDF.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );

      fixture.detectChanges();
      tick();

      expect(component.notificationMessage).toBeTruthy();
    }));

    it('should handle non-PDF blob from API', fakeAsync(() => {
      mockApiService.getSpecificDocumentPDF.and.returnValue(
        of(new Blob(['not pdf'], { type: 'text/plain' }))
      );

      fixture.detectChanges();
      tick();

      expect(component.notificationMessage).toBe('Palvelin ei palauttanut PDF-tiedostoa.');
    }));

    it('should handle JSON error response from backend', fakeAsync(() => {
      // Simuloidaan JSON-virhevastausta palvelimelta
      const errorBlob = new Blob(['{"error":"Bad Request","syy":"Invalid format"}'], {
        type: 'application/json',
      });

      const mockError: any = new Error('PDF fetch failed');
      mockError.error = errorBlob;

      mockApiService.getSpecificDocumentPDF.and.returnValue(throwError(() => mockError));

      fixture.detectChanges();
      tick();

      // Varmistetaan että komponentti käsittelee virheen
      expect(component).toBeTruthy();
    }));

    it('should handle case when sender is missing', fakeAsync(() => {
      mockApiService.getSpecificUnfinishedDocument.and.returnValue(
        of({
          id: 123,
          sender: null,
          products: [],
        })
      );

      fixture.detectChanges();
      tick();

      expect(component.company).toBe('');
    }));

    it('should handle case when company name is missing', fakeAsync(() => {
      mockApiService.getSpecificUnfinishedDocument.and.returnValue(
        of({
          id: 123,
          sender: { company: null },
          products: [],
        })
      );

      fixture.detectChanges();
      tick();

      expect(component.company).toBe('');
    }));
  });

  describe('switchModal', () => {
    it('should toggle showModal from false to true', () => {
      component.showModal = false;
      component.switchModal();
      expect(component.showModal).toBe(true);
    });

    it('should toggle showModal from true to false', () => {
      component.showModal = true;
      component.switchModal();
      expect(component.showModal).toBe(false);
    });
  });

  describe('handleSubmit', () => {
    // Testi dokumentin lähetykselle
    it('should submit document and navigate on success', fakeAsync(() => {
      component.tuoteRivit = [
        {
          id: 1,
          document_id: 100,
          product_name: 'Test',
          code: 'ABC',
          ordered_quantity: 5,
          shipped_quantity: 3,
          note: 'Test note',
        } as any,
      ];

      mockApiService.updateDocument.and.returnValue(of({ success: true }));

      component.handleSubmit();
      tick();

      // Varmistetaan että dokumentti tallennettiin ja navigointi tapahtui
      expect(mockApiService.updateDocument).toHaveBeenCalledWith(component.tuoteRivit);
      expect(component.notificationStatus).toBe(true);
      expect(component.notificationMessage).toBe('Tallennus onnistui');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['home', false]);
    }));

    it('should show error notification on submit failure', fakeAsync(() => {
      component.tuoteRivit = [];

      mockApiService.updateDocument.and.returnValue(throwError(() => new Error('Submit error')));

      component.handleSubmit();
      tick();

      expect(component.notificationStatus).toBe(false);
      expect(component.notificationMessage).toBe('Tallennus epäonnistui');
    }));
  });

  describe('handleReturn', () => {
    // Testi paluureititykselle
    it('should navigate back to home', () => {
      component.handleReturn();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['home', false]);
    });
  });

  it('should have title Yrityksen nimi', fakeAsync(() => {
    // Tarkistetaan että otsikko näyttää yrityksen nimen
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    const otsikko = fixture.nativeElement.querySelector('[data-testid="otsikko"]');
    expect(otsikko?.textContent?.trim()).toBe('Yrityksen nimi');
  }));
});
