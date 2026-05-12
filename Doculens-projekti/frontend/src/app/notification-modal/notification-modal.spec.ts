import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { NotificationModal } from './notification-modal';

// NotificationModal-komponentin testit
describe('NotificationModal', () => {
  let component: NotificationModal;
  let fixture: ComponentFixture<NotificationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationModal],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationModal);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Siivotaan ajastimet ngOnDestroy metodin kautta
    component.ngOnDestroy();
  });

  it('should create', () => {
    // Tarkistetaan että komponentti on luotu onnistuneesti
    expect(component).toBeTruthy();
  });

  describe('Component Properties', () => {
    // Testataan komponentin ominaisuuksien oletusarvoja
    it('should initialize with default values', () => {
      expect(component.isSuccess).toBe(true);
      expect(component.message).toBe('');
      expect(component.autoCloseMs).toBe(2000);
      expect(component.closing).toBe(false);
    });

    it('should accept isSuccess input', () => {
      component.isSuccess = false;
      expect(component.isSuccess).toBe(false);
    });

    it('should accept message input', () => {
      component.message = 'Test message';
      expect(component.message).toBe('Test message');
    });

    it('should accept autoCloseMs input', () => {
      component.autoCloseMs = 5000;
      expect(component.autoCloseMs).toBe(5000);
    });
  });

  describe('closeModal Output', () => {
    // Testataan closeModal tapahtuman lähettämistä
    it('should have closeModal EventEmitter', () => {
      expect(component.closeModal).toBeDefined();
    });

    it('should emit closeModal event', fakeAsync(() => {
      spyOn(component.closeModal, 'emit');
      component.onCloseClick();

      // Odotetaan sulkemisanimaation valmistumista
      tick(260);

      expect(component.closeModal.emit).toHaveBeenCalledWith();
    }));
  });

  describe('ngOnInit', () => {
    // Testataan automaattista sulkemista onnistuneille ilmoituksille
    it('should set auto-close timer for successful notification', fakeAsync(() => {
      component.isSuccess = true;
      component.autoCloseMs = 1000;
      spyOn(component.closeModal, 'emit');

      component.ngOnInit();
      tick(1000);
      tick(300); // Sulkemisanimatio

      expect(component.closeModal.emit).toHaveBeenCalled();
    }));

    it('should not set timer when isSuccess is false', fakeAsync(() => {
      // Virheissä ei ole automaattista sulkemista
      component.isSuccess = false;
      component.autoCloseMs = 1000;
      spyOn(component.closeModal, 'emit');

      component.ngOnInit();
      tick(1000);

      expect(component.closeModal.emit).not.toHaveBeenCalled();
    }));

    it('should not set timer when autoCloseMs is 0', fakeAsync(() => {
      component.isSuccess = true;
      component.autoCloseMs = 0;
      spyOn(component.closeModal, 'emit');

      component.ngOnInit();
      tick(100);

      expect(component.closeModal.emit).not.toHaveBeenCalled();
    }));

    it('should not set timer when autoCloseMs is null', fakeAsync(() => {
      component.isSuccess = true;
      component.autoCloseMs = null;
      spyOn(component.closeModal, 'emit');

      component.ngOnInit();
      tick(100);

      expect(component.closeModal.emit).not.toHaveBeenCalled();
    }));

    it('should not set timer when autoCloseMs is negative', fakeAsync(() => {
      component.isSuccess = true;
      component.autoCloseMs = -1000;
      spyOn(component.closeModal, 'emit');

      component.ngOnInit();
      tick(100);

      expect(component.closeModal.emit).not.toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    // Testataan ajastimen poistamista komponentti tuhoutuessa
    it('should clear timer on destroy', fakeAsync(() => {
      component.isSuccess = true;
      component.autoCloseMs = 2000;
      spyOn(component.closeModal, 'emit');

      component.ngOnInit();
      component.ngOnDestroy();
      tick(2500);

      // Tapahtumaa ei pitäisi tulla koska ajastin on poistettu
      expect(component.closeModal.emit).not.toHaveBeenCalled();
    }));
  });

  describe('onCloseClick', () => {
    // Testataan sulkemispainikkeen klikkausta
    it('should start closing animation and emit event', fakeAsync(() => {
      spyOn(component.closeModal, 'emit');

      component.onCloseClick();

      expect(component.closing).toBe(true);

      // Odotetaan sulkemisanimaation valmistumista
      tick(260);
      expect(component.closeModal.emit).toHaveBeenCalledWith();
    }));

    it('should clear auto-close timer when clicked', fakeAsync(() => {
      component.isSuccess = true;
      component.autoCloseMs = 2000;
      spyOn(component.closeModal, 'emit');

      component.ngOnInit();
      tick(500);

      component.onCloseClick();
      tick(2000);

      // Tapahtumaa pitäisi tulla vain kerran (klikista, ei automaatista)
      expect(component.closeModal.emit).toHaveBeenCalledTimes(1);
    }));

    it('should set closing flag to true', () => {
      component.closing = false;
      component.onCloseClick();
      expect(component.closing).toBe(true);
    });
  });

  describe('onBackgroundClick', () => {
    // Testataan taustan klikkausta
    it('should start closing when isSuccess is true', fakeAsync(() => {
      component.isSuccess = true;
      spyOn(component.closeModal, 'emit');
      const event = new MouseEvent('click');

      component.onBackgroundClick(event);

      expect(component.closing).toBe(true);

      tick(260);
      expect(component.closeModal.emit).toHaveBeenCalledWith();
    }));

    it('should stop propagation when isSuccess is false', () => {
      // Virheissä tausta-klikkaus pysäytetään
      component.isSuccess = false;
      spyOn(component.closeModal, 'emit');
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');

      component.onBackgroundClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.closeModal.emit).not.toHaveBeenCalled();
    });

    it('should not close modal on background click for error notifications', fakeAsync(() => {
      component.isSuccess = false;
      spyOn(component.closeModal, 'emit');
      const event = new MouseEvent('click');

      component.onBackgroundClick(event);
      tick(300);

      expect(component.closeModal.emit).not.toHaveBeenCalled();
      expect(component.closing).toBe(false);
    }));

    it('should close modal on background click for success notifications', fakeAsync(() => {
      component.isSuccess = true;
      spyOn(component.closeModal, 'emit');
      const event = new MouseEvent('click');

      component.onBackgroundClick(event);

      expect(component.closing).toBe(true);
      tick(260);
      expect(component.closeModal.emit).toHaveBeenCalledWith();
    }));
  });

  describe('Timer management', () => {
    // Testataan ajastimen hallintaa
    it('should properly clear timer on multiple calls', fakeAsync(() => {
      component.isSuccess = true;
      component.autoCloseMs = 1000;
      spyOn(component.closeModal, 'emit');

      component.ngOnInit();
      tick(500);
      component.onCloseClick();
      tick(300);

      // Tapahtumaa vain kerran (klikista)
      expect(component.closeModal.emit).toHaveBeenCalledTimes(1);
    }));

    it('should handle null timer gracefully', () => {
      component['autoTimer'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Closing animation state', () => {
    // Testataan sulkemisanimaation tilaa
    it('should set closing flag before emit', fakeAsync(() => {
      let closingFlagWhenEmitted = false;
      component.closeModal.subscribe(() => {
        closingFlagWhenEmitted = component.closing;
      });

      component.onCloseClick();
      tick(260);

      expect(closingFlagWhenEmitted).toBe(true);
    }));

    it('should maintain closing flag after emit', fakeAsync(() => {
      component.onCloseClick();
      tick(260);

      expect(component.closing).toBe(true);
    }));
  });

  describe('Integration tests', () => {
    // Kokonaisvaltaisia testejä komponentin käytölle
    it('should handle rapid close clicks', fakeAsync(() => {
      spyOn(component.closeModal, 'emit');

      component.onCloseClick();
      tick(260);

      // Seuraavat klikkaukset eivät aiheuta uusia tapahtumia
      component.onCloseClick();
      tick(100);
      component.onCloseClick();
      tick(100);

      // Vain ensimmäinen klikkaus (260ms viiveen jälkeen) saa emitin tapahtumaan – muiden nopeiden klikkausten ei pitäisi aiheuttaa uusia emittejä
      expect(component.closeModal.emit).toHaveBeenCalledTimes(1);
    }));

    it('should handle success notification flow', fakeAsync(() => {
      component.isSuccess = true;
      component.message = 'Success!';
      component.autoCloseMs = 2000;
      spyOn(component.closeModal, 'emit');

      fixture.detectChanges();
      component.ngOnInit();

      tick(2000);
      tick(300);

      expect(component.closeModal.emit).toHaveBeenCalled();
    }));

    it('should handle error notification flow', fakeAsync(() => {
      component.isSuccess = false;
      component.message = 'Error occurred!';
      component.autoCloseMs = 2000;
      spyOn(component.closeModal, 'emit');

      fixture.detectChanges();
      component.ngOnInit();

      tick(2000);
      tick(300);

      // Virheillä ei ole automaattista sulkemista
      expect(component.closeModal.emit).not.toHaveBeenCalled();

      // Manuaalisesti suljetaan
      component.onCloseClick();
      tick(260);
      expect(component.closeModal.emit).toHaveBeenCalled();
    }));
  });
});
