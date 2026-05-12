import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Modal } from './png-modal';

// Modal-komponentin testit
describe('Modal', () => {
  let component: Modal;
  let fixture: ComponentFixture<Modal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Modal],
    }).compileComponents();

    fixture = TestBed.createComponent(Modal);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    // Tarkistetaan että komponentti on luotu onnistuneesti
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    // Testataan komponentin alustusta
    it('should log "Modaali auki!" to console', () => {
      spyOn(console, 'log');
      fixture.detectChanges();
      expect(console.log).toHaveBeenCalledWith('Modaali auki!');
    });
  });

  describe('pdfUrl Input', () => {
    // Testataan pdfUrl-syötteen käsittelyä
    it('should initialize without pdfUrl', () => {
      expect(component.pdfUrl).toBeUndefined();
    });

    it('should accept pdfUrl input', () => {
      const testUrl = 'blob:test' as any;
      component.pdfUrl = testUrl;
      expect(component.pdfUrl).toBe(testUrl);
    });
  });

  describe('closeModal Output', () => {
    // Testataan closeModal-tapahtuman lähettämistä
    it('should have closeModal EventEmitter', () => {
      expect(component.closeModal).toBeDefined();
    });

    it('should emit closeModal event when onCloseClick is called', () => {
      spyOn(component.closeModal, 'emit');
      component.onCloseClick();
      expect(component.closeModal.emit).toHaveBeenCalledWith();
    });

    it('should log pdfUrl when onCloseClick is called', () => {
      spyOn(console, 'log');
      component.pdfUrl = 'test-url' as any;

      component.onCloseClick();

      // Implementaatio loggaa kaksi argumenttia: 'PdfUrl =' ja URL
      expect(console.log).toHaveBeenCalledWith('PdfUrl =', 'test-url');
    });
  });

  describe('onBackgroundClick', () => {
    // Testataan taustan klikkausta
    it('should emit closeModal event when background is clicked', () => {
      spyOn(component.closeModal, 'emit');
      const mockEvent = new MouseEvent('click');

      component.onBackgroundClick(mockEvent);

      expect(component.closeModal.emit).toHaveBeenCalledWith();
    });

    it('should log pdfUrl when background is clicked', () => {
      spyOn(console, 'log');
      component.pdfUrl = 'test-url' as any;
      const mockEvent = new MouseEvent('click');

      component.onBackgroundClick(mockEvent);

      // Implementaatio loggaa kaksi argumenttia: 'PdfUrl =' ja URL
      expect(console.log).toHaveBeenCalledWith('PdfUrl =', 'test-url');
    });

    it('should handle background click with undefined pdfUrl', () => {
      spyOn(console, 'log');
      spyOn(component.closeModal, 'emit');
      const mockEvent = new MouseEvent('click');

      component.onBackgroundClick(mockEvent);

      expect(component.closeModal.emit).toHaveBeenCalledWith();
      // Implementaatio loggaa kaksi argumenttia: 'PdfUrl =' ja undefined
      expect(console.log).toHaveBeenCalledWith('PdfUrl =', undefined);
    });
  });

  describe('Modal interaction', () => {
    // Testataan modaalin käyttäjän vuorovaikutusta
    it('should close modal on close button click', () => {
      spyOn(component.closeModal, 'emit');

      component.onCloseClick();

      expect(component.closeModal.emit).toHaveBeenCalledTimes(1);
    });

    it('should close modal on background click', () => {
      spyOn(component.closeModal, 'emit');
      const mockEvent = new MouseEvent('click');

      component.onBackgroundClick(mockEvent);

      expect(component.closeModal.emit).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple close events', () => {
      spyOn(component.closeModal, 'emit');

      component.onCloseClick();
      component.onCloseClick();

      expect(component.closeModal.emit).toHaveBeenCalledTimes(2);
    });

    it('should emit closeModal on both button and background click', () => {
      spyOn(component.closeModal, 'emit');
      const mockEvent = new MouseEvent('click');

      component.onCloseClick();
      component.onBackgroundClick(mockEvent);

      expect(component.closeModal.emit).toHaveBeenCalledTimes(2);
    });
  });
});
