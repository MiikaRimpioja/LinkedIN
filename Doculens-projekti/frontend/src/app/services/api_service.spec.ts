import { TestBed } from '@angular/core/testing';

import { Api } from './api_service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Endpoints } from './endpoints_service';
import { of, throwError } from 'rxjs';

// Api-palvelun testit
describe('Api', () => {
  let service: Api;
  let httpMock: HttpTestingController;
  let endpointsService: jasmine.SpyObj<Endpoints>;

  beforeEach(() => {
    // Luodaan mockattu Endpoints-palvelu
    const endpointsSpy = jasmine.createSpyObj('Endpoints', ['getEndpoints']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: Endpoints, useValue: endpointsSpy }],
    });

    service = TestBed.inject(Api);
    httpMock = TestBed.inject(HttpTestingController);
    endpointsService = TestBed.inject(Endpoints) as jasmine.SpyObj<Endpoints>;
  });

  afterEach(() => {
    // Varmistetaan että kaikki HTTP-pyynnöt on käsitelty
    httpMock.verify();
  });

  it('should be created', () => {
    // Tarkistetaan että palvelu on luotu onnistuneesti
    expect(service).toBeTruthy();
  });

  describe('Service properties', () => {
    // Testataan palvelun oletusominaisuuksia
    it('should initialize with correct default values', () => {
      // Api:n oletusarvot muuttuivat; tarkistetaan nykyiset arvot
      expect(service.username).toBe('softa');
      expect(service.password).toBe('Password');
      expect(service.amount).toBe(10);
      expect(service.keskenUrl).toBeUndefined();
      expect(service.keskenPdfUrl).toBeUndefined();
      expect(service.valmiitUrl).toBeUndefined();
      expect(service.valmiitHakuUrl).toBe('');
      expect(service.uploadPdfUrl).toBeUndefined();
    });
  });

  describe('loadEndpoints', () => {
    // Testataan endpointien lataamista ja välimuistintamista
    it('should load endpoints from service and cache them', (done) => {
      const mockEndpoints = {
        upload_ocr: 'http://api/upload',
        kesken_url: 'http://api/unfinished',
        keskenpdf_url: 'http://api/unfinished-pdf',
        valmiit_url: 'http://api/finished',
        valmiit_haku_url: 'http://api/finished-search',
      };

      endpointsService.getEndpoints.and.returnValue(of(mockEndpoints));

      service.loadEndpoints().subscribe(() => {
        // Varmistetaan että kaikki endpointit asetettiin oikein
        expect(service.uploadPdfUrl).toBe('http://api/upload');
        expect(service.keskenUrl).toBe('http://api/unfinished');
        expect(service.keskenPdfUrl).toBe('http://api/unfinished-pdf');
        expect(service.valmiitUrl).toBe('http://api/finished');
        expect(service.valmiitHakuUrl).toBe('http://api/finished-search');
        done();
      });
    });

    it('should use cached endpoints on second load without force', (done) => {
      const mockEndpoints = {
        upload_ocr: 'http://api/upload',
        kesken_url: 'http://api/unfinished',
        keskenpdf_url: 'http://api/unfinished-pdf',
        valmiit_url: 'http://api/finished',
        valmiit_haku_url: 'http://api/finished-search',
      };

      endpointsService.getEndpoints.and.returnValue(of(mockEndpoints));

      service.loadEndpoints().subscribe(() => {
        // Ensimmäinen kutsu pitäisi laukaista getEndpoints
        expect(endpointsService.getEndpoints).toHaveBeenCalledTimes(1);

        service.loadEndpoints().subscribe(() => {
          // Toinen kutsu ilman force:a ei pitäisi laukaista getEndpoints:ia uudelleen
          expect(endpointsService.getEndpoints).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should reload endpoints when forceReload is true', (done) => {
      const mockEndpoints = {
        upload_ocr: 'http://api/upload',
        kesken_url: 'http://api/unfinished',
        keskenpdf_url: 'http://api/unfinished-pdf',
        valmiit_url: 'http://api/finished',
        valmiit_haku_url: 'http://api/finished-search',
      };

      endpointsService.getEndpoints.and.returnValue(of(mockEndpoints));

      service.loadEndpoints().subscribe(() => {
        service.loadEndpoints(true).subscribe(() => {
          // forceReload=true pitäisi hakea uudelleen
          expect(endpointsService.getEndpoints).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    it('should handle error when loading endpoints', (done) => {
      const error = new Error('Network error');
      endpointsService.getEndpoints.and.returnValue(throwError(() => error));

      service.loadEndpoints().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should log error for missing upload_ocr', (done) => {
      spyOn(console, 'error');
      const mockEndpoints = {
        kesken_url: 'http://api/unfinished',
        keskenpdf_url: 'http://api/unfinished-pdf',
        valmiit_url: 'http://api/finished',
        valmiit_haku_url: 'http://api/finished-search',
      };

      endpointsService.getEndpoints.and.returnValue(of(mockEndpoints));

      service.loadEndpoints().subscribe(() => {
        // Varmistetaan että puuttuva endpoint kirjataan
        expect(console.error).toHaveBeenCalledWith('Missing upload_ocr in response!');
        done();
      });
    });

    it('should handle missing individual endpoints', (done) => {
      spyOn(console, 'error');
      const mockEndpoints = {
        upload_ocr: 'http://api/upload',
      };

      endpointsService.getEndpoints.and.returnValue(of(mockEndpoints));

      service.loadEndpoints().subscribe(() => {
        expect(console.error).toHaveBeenCalledWith('Missing kesken_url in response!');
        expect(console.error).toHaveBeenCalledWith('Missing keskenpdf_url in response!');
        expect(console.error).toHaveBeenCalledWith('Missing valmiit_url in response!');
        expect(console.error).toHaveBeenCalledWith('Missing valmiit_haku_url in response!');
        done();
      });
    });
  });

  describe('getUnfinishedDocuments', () => {
    // Testataan keskeneräisten dokumenttien hakua
    beforeEach(() => {
      service.keskenUrl = 'http://api/unfinished';
    });

    it('should fetch unfinished documents with correct headers', () => {
      service.getUnfinishedDocuments().subscribe();

      const req = httpMock.expectOne('http://api/unfinished');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('username')).toBe('softa');
      expect(req.request.headers.get('password')).toBe('Password');
      expect(req.request.headers.get('amount')).toBe('10');

      req.flush([]);
    });

    it('should throw error if keskenUrl is not initialized', () => {
      service.keskenUrl = null;
      expect(() => service.getUnfinishedDocuments()).toThrowError('keskenUrl is not initialized!');
    });
  });

  describe('getSpecificUnfinishedDocument', () => {
    // Testataan yksittäisen keskeneräisen dokumentin hakua
    beforeEach(() => {
      service.keskenUrl = 'http://api/unfinished';
    });

    it('should fetch specific unfinished document with correct URL and headers', () => {
      service.getSpecificUnfinishedDocument(123).subscribe();

      const req = httpMock.expectOne('http://api/unfinished/123');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('username')).toBe('softa');
      expect(req.request.headers.get('password')).toBe('Password');

      req.flush({ id: 123, name: 'doc' });
    });

    it('should work with string ID', () => {
      service.getSpecificUnfinishedDocument('abc123').subscribe();

      const req = httpMock.expectOne('http://api/unfinished/abc123');
      expect(req.request.method).toBe('GET');

      req.flush({});
    });
  });

  describe('getSpecificDocumentPDF', () => {
    // Testataan PDF-dokumentin hakua
    beforeEach(() => {
      service.keskenPdfUrl = 'http://api/pdf';
    });

    it('should fetch PDF with blob response type', () => {
      service.getSpecificDocumentPDF(123).subscribe();

      const req = httpMock.expectOne('http://api/pdf/123');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      expect(req.request.headers.get('username')).toBe('softa');
      expect(req.request.headers.get('password')).toBe('Password');

      const blob = new Blob(['test'], { type: 'application/pdf' });
      req.flush(blob);
    });

    it('should work with string ID', () => {
      service.getSpecificDocumentPDF('doc-id').subscribe();

      const req = httpMock.expectOne('http://api/pdf/doc-id');
      expect(req.request.method).toBe('GET');

      req.flush(new Blob());
    });
  });

  describe('getFinishedDocuments', () => {
    // Testataan valmiiden dokumenttien hakua
    beforeEach(() => {
      service.valmiitUrl = 'http://api/finished';
    });

    it('should fetch finished documents with correct headers', () => {
      service.getFinishedDocuments().subscribe();

      const req = httpMock.expectOne('http://api/finished');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('username')).toBe('softa');
      expect(req.request.headers.get('password')).toBe('Password');

      req.flush([]);
    });
  });

  describe('searchFinishedDocuments', () => {
    // Testataan valmiiden dokumenttien hakua ja suodatusta
    beforeEach(() => {
      service.valmiitHakuUrl = 'http://api/finished-search';
    });

    it('should search with search term only', () => {
      service.searchFinishedDocuments('test').subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://api/finished-search');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('searchTerm')).toBe('test');
      expect(req.request.params.get('searchDate')).toBeNull();
      expect(req.request.headers.get('username')).toBe('softa');

      req.flush([]);
    });

    it('should search with search term and date', () => {
      service.searchFinishedDocuments('test', '2025-01-01').subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://api/finished-search');
      expect(req.request.params.get('searchTerm')).toBe('test');
      expect(req.request.params.get('searchDate')).toBe('2025-01-01');

      req.flush([]);
    });

    it('should convert numeric search term to string', () => {
      service.searchFinishedDocuments(123).subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://api/finished-search');
      expect(req.request.params.get('searchTerm')).toBe('123');

      req.flush([]);
    });

    it('should handle null search date', () => {
      service.searchFinishedDocuments('test', null).subscribe();

      const req = httpMock.expectOne((r) => r.url === 'http://api/finished-search');
      expect(req.request.params.get('searchDate')).toBeNull();

      req.flush([]);
    });
  });

  describe('updateDocument', () => {
    // Testataan dokumentin päivittämistä
    beforeEach(() => {
      service.valmiitUrl = 'http://api/finished';
    });

    it('should post document with correct headers', () => {
      const documentData = { id: 1, name: 'doc' };
      service.updateDocument(documentData).subscribe();

      const req = httpMock.expectOne('http://api/finished');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(documentData);
      expect(req.request.headers.get('username')).toBe('softa');
      expect(req.request.headers.get('password')).toBe('Password');

      req.flush({ success: true });
    });
  });

  describe('uploadPdf', () => {
    // Testataan PDF-tiedostojen latausta
    beforeEach(() => {
      service.uploadPdfUrl = 'http://api/upload';
    });

    it('should upload PDF file with correct form data', () => {
      const fileData = new Uint8Array([1, 2, 3]);
      const fileName = 'test.pdf';

      service.uploadPdf(fileData, fileName, null).subscribe();

      const req = httpMock.expectOne('http://api/upload');
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('username')).toBe('softa');
      expect(req.request.headers.get('password')).toBe('Password');

      // Varmistetaan että FormData on luotu oikein
      expect(req.request.body instanceof FormData).toBe(true);

      req.flush({ success: true });
    });

    it('should handle PDF upload with different file names', () => {
      const fileData = new Uint8Array([4, 5, 6]);
      const fileName = 'document-2025.pdf';

      service.uploadPdf(fileData, fileName, null).subscribe();

      const req = httpMock.expectOne('http://api/upload');
      expect(req.request.method).toBe('POST');

      req.flush({ success: true });
    });
  });

  describe('Custom headers', () => {
    // Testataan mukautettujen otsakkeistoon liittyvää logiikkaa
    it('should allow changing username and password', () => {
      service.username = 'newuser';
      service.password = 'newpass';
      service.valmiitUrl = 'http://api/finished';

      service.getFinishedDocuments().subscribe();

      const req = httpMock.expectOne('http://api/finished');
      expect(req.request.headers.get('username')).toBe('newuser');
      expect(req.request.headers.get('password')).toBe('newpass');

      req.flush([]);
    });

    it('should allow changing amount parameter', () => {
      service.amount = 20;
      service.keskenUrl = 'http://api/unfinished';

      service.getUnfinishedDocuments().subscribe();

      const req = httpMock.expectOne('http://api/unfinished');
      expect(req.request.headers.get('amount')).toBe('20');

      req.flush([]);
    });
  });
});
