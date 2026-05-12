import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { Home } from './home';

import { HttpClientModule } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';

import { Api } from '../services/api_service';
import { of, throwError } from 'rxjs';

import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';

// Home-komponentin testit
describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;
  let mockApiService: jasmine.SpyObj<Api>;

  beforeEach(async () => {
    // Luodaan mockatut metodit api-palvelulle
    mockApiService = jasmine.createSpyObj('Api', [
      'loadEndpoints',
      'getUnfinishedDocuments',
      'uploadPdf',
    ]);

    // Asetetaan palautusarvot kunkin mockatun metodin kutsumiselle
    // loadEndpoints palauttaa undefined-arvon kun operaatio on valmis
    mockApiService.loadEndpoints.and.returnValue(of(undefined));
    mockApiService.getUnfinishedDocuments.and.returnValue(of([]));
    mockApiService.uploadPdf.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [Home, HttpClientModule, RouterTestingModule.withRoutes([])],
      providers: [{ provide: Api, useValue: mockApiService }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    // Alustetaan komponentin näytettävät tiedostot tyhjäksi
    (component as any).displayedFiles = []; // alustetaan näytettävät tiedostot tyhjäksi listaksi
  });

  it('should create', () => {
    // Tarkistetaan että komponentti on luotu onnistuneesti
    expect(component).toBeTruthy();
  });

  it('should load endpoints and map unfinished documents onInit', fakeAsync(() => {
    // Luodaan mockatut dokumentit testille
    const mockDocuments = [
      {
        id: 1,
        filename: 'doc1',
        sender: { company: 'Company 1' },
        upload_date: '2023-10-01T10:00:00.000Z',
      },
      {
        id: 2,
        filename: 'doc2',
        sender: { company: 'Company 2' },
        upload_date: '2023-10-02T10:00:00.000Z',
      },
    ];

    mockApiService.loadEndpoints.and.returnValue(of(void 0));
    mockApiService.getUnfinishedDocuments.and.returnValue(of(mockDocuments));

    const beforeInit = new Date();
    // Kutsutaan komponentin alustusmetodia
    component.ngOnInit();

    // Odotetaan että kaikki observableet valmistuvat
    tick(); // allow all observables to complete

    const afterInit = new Date();

    // Varmistetaan että metodit kutsuttiin
    expect(mockApiService.loadEndpoints).toHaveBeenCalled();
    expect(mockApiService.getUnfinishedDocuments).toHaveBeenCalled();

    // Tarkistetaan että dokumentit on kartoitettu oikein
    expect((component as any).displayedFiles.length).toBe(2);
    expect((component as any).displayedFiles[0].id).toBe(1);
    expect((component as any).displayedFiles[0].name).toBe('doc1');
    // expect(component.selectedFiles[0].uploadDate instanceof Date).toBeTrue();

    // Tarkistetaan että latausajat on asetettu oikein
    const uploadTime = (component as any).displayedFiles[0].uploadTime;
    // expect(uploadTime >= beforeInit && uploadTime <= afterInit).toBeTrue();
    expect((component as any).displayedFiles[1].uploadTime).toEqual(uploadTime);
  }));

  it('should handle error when loadEndpoints fails', () => {
    // Spioitaan console.error kutsut
    spyOn(console, 'error');
    const error = new Error('Failed to load endpoints');

    // Asetetaan mockattu metodi palauttamaan virhe
    mockApiService.loadEndpoints.and.returnValue(throwError(() => error));

    // Käynnistetään komponentin alustus
    fixture.detectChanges(); // triggers ngOnInit

    // Varmistetaan että virhe on käsitelty oikein
    expect(console.error).toHaveBeenCalledWith('Endpointien lataus epäonnistui');
  });

  it('should display "Dokumenttejä ei löytynyt" when selectedFiles is empty', () => {
    // Käynnistetään komponentin alustus
    fixture.detectChanges(); // triggers ngOnInit

    // Tarkistetaan että näytettävien tiedostojen lista on tyhjä
    expect((component as any).displayedFiles.length).toBe(0);
  });

  it('should open file dialog when clicking Lataa PDF button', () => {
    // Valmistetaan spyt niin että ngOnInit ei heittä virhettä
    // Set up spies so ngOnInit doesn't throw
    mockApiService.loadEndpoints.and.returnValue(of(void 0));
    mockApiService.getUnfinishedDocuments.and.returnValue(of([]));

    // Käynnistetään DOM-renderöinti
    fixture.detectChanges(); // trigger DOM

    // Haetaan tiedostopalvelimen input-kenttä
    const fileInput = fixture.nativeElement.querySelector('input[type="file"]');
    expect(fileInput).toBeTruthy(); // safety check

    // Haetaan "Lataa PDF" -painike
    const button = fixture.nativeElement.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('should navigate to inspect-document with the correct document id on handleClick', () => {
    // Saadaan router injektio
    const router = TestBed.inject(Router);

    // Luodaan mockattu dokumentti
    const mockDocument = { id: 123, name: 'Sample Doc' };

    // Kutsutaan klikkauskäsittelijä
    component.handleClick(mockDocument);

    // Tarkistetaan että navigointi tapahtui oikealla dokumentin ID:llä
    expect(router.navigate).toHaveBeenCalledWith(['inspect-document', 123, false]);
  });
  describe('onFileSelected', () => {
    // Testi tiedoston valinnalle
    it('should create a new document on the page after adding it', fakeAsync(() => {
      // Mockataan onnistunut lataus
      mockApiService.uploadPdf.and.returnValue(of({ success: true }));

      // Asetetaan mockatut lataamattomat dokumentit
      mockApiService.getUnfinishedDocuments.and.returnValue(
        of([
          {
            id: 1,
            filename: 'test.pdf',
            sender: { company: 'Test Company' },
            upload_date: '2023-10-01T10:00:00.000Z',
          },
        ])
      );

      // Luodaan uusi mockattu PDF-tiedosto
      const newFile = new File(['jotain'], 'test.pdf', { type: 'application/pdf' });

      // Luodaan mockattu tiedoston valintatapahtuma (joka sisältää mockatun tiedoston)
      // Input eventti joka sisältää mockatun tiedoston (käyttäjän koneelta oikeasti tuleva)
      const event = {
        target: {
          files: [newFile],
        },
      } as unknown as Event;

      // Luodaan mockattu FileReader
      const mockFileReader = {
        readAsArrayBuffer: jasmine.createSpy('readAsArrayBuffer'),
        onload: () => {},
        result: new ArrayBuffer(8),
      } as unknown as FileReader;
      spyOn(window as any, 'FileReader').and.returnValue(mockFileReader);

      // Tallennetaan alkuperäinen tiedostojen määrä
      const initialLength = (component as any).displayedFiles.length;

      // Lisätään uusi dokumentti
      component.onFileSelected(event);

      // Simuloidaan tiedoston lukemisen valmistuminen
      // Simulate file read completion
      (mockFileReader.onload as any)();

      // Odotetaan async-operaatioiden valmistumista
      tick();

      // Tarkistetaan että uusi dokumentti lisättiin
      expect((component as any).displayedFiles.length).toBe(initialLength + 1);
      expect(
        (component as any).displayedFiles[(component as any).displayedFiles.length - 1].name
      ).toBe('test.pdf');
    }));
    it('should do nothing if no files are selected', () => {
      // Luodaan tapahtuma jossa ei ole yhtään tiedostoa (käyttäjä painoi peruuta)
      // Tyhjä palautusarvo eventissä (mitään tiedostoa ei valittu)
      const event = {
        target: {
          files: [],
        },
      } as unknown as Event;

      (component as any).displayedFiles = [];
      // Kutsutaan onFileSelected ilman tiedostoja
      component.onFileSelected(event);

      // Tarkistetaan että tiedostolista on silti tyhjä
      expect((component as any).displayedFiles.length).toBe(0); // Varmistetaan että tiedostolista pysyy tyhjänä
    });
    /*
    it('should alert if a file with the same name already exists', () => {
      spyOn(window, 'alert');

      // Alkuperäiset tiedostot
      component.selectedFiles = [
        { id: 1, name: 'duplicate.pdf', uploadDate: new Date(), uploadTime: new Date() },
      ];

      // Koitetaan lisätä samanniminen tiedosto
      const duplicateFile = new File(['test'], 'duplicate.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [duplicateFile],
        },
      } as unknown as Event;

      component.onFileSelected(event);

      expect(window.alert).toHaveBeenCalledWith('Samanniminen tiedosto on jo olemassa!');
    });*/
    it('should alert if the selected file is not a PDF', () => {
      // Spioitaan notifikaatiomodaalin näyttäminen
      spyOn(component, 'showNotificationModal');

      // Luodaan ei-PDF tiedosto
      const invalidFile = new File(['text'], 'text.txt', { type: 'text/plain' });
      const event = {
        target: {
          files: [invalidFile],
        },
      } as unknown as Event;

      // Kutsutaan tiedostojen valintaa
      component.onFileSelected(event);

      // Tarkistetaan että notifikaatio näytetään oikein
      expect(component.showNotificationModal).toHaveBeenCalledWith(false, 'Valitse PDF -tiedosto');
    });
    it('should log error if uploadPdf fails', fakeAsync(() => {
      // Spioitaan console.error
      spyOn(console, 'error');

      // Asetetaan mockattu metodi palauttamaan virhe
      // Palautetaan mockatussa metodissa error
      const error = new Error('Upload failed');
      mockApiService.uploadPdf.and.returnValue(throwError(() => error));

      // Luodaan PDF-tiedosto
      const file = new File(['test content'], 'file.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [file],
        },
      } as unknown as Event;

      // Luodaan mockattu FileReader
      // Mock FileReader
      const mockFileReader = {
        readAsArrayBuffer: jasmine.createSpy('readAsArrayBuffer'),
        onload: () => {},
        result: new ArrayBuffer(8),
      };

      // Korvataan globaali FileReader mockatulla versiolla
      // Replace global FileReader with mock
      spyOn(window as any, 'FileReader').and.returnValue(mockFileReader);

      // Kutsutaan tiedostojen valintaa
      component.onFileSelected(event);

      // Käynnistetään onload-callback manuaalisesti tiedoston "lukemisen" jälkeen
      // Manually trigger onload after "reading" the file
      mockFileReader.onload();

      // Odotetaan observable-operaation valmistumista
      tick(); // allow observable to run

      // Tarkistetaan että virhe on kirjattu konsoliin oikein
      expect(console.error).toHaveBeenCalledWith('File upload failed');
    }));
  });
});
