import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, input } from '@angular/core';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  templateUrl: './notification-modal.html',
  styleUrls: ['./notification-modal.scss'],
})
export class NotificationModal {
  /** Onnistuminen / epäonnistuminen */
  @Input() isSuccess: boolean = true;

  /** Näytettävä viesti modalissa */
  @Input() message: string = '';

  @Input() showOkButton: boolean = true;

  /** Automaattinen sulkeutuminen millisekunteina (aseta esim. 2000). Jos null/0 niin ei automaattista sulkua. */
  @Input() autoCloseMs: number | null = 2000;

  /** Sulkemistapahtuma äitikomponentille */
  @Output() closeModal = new EventEmitter<void>();

  /** Tämä määrittää, näytetäänkö latausviesti vai normaali viesti */
  @Input() isLoading: boolean = false;

  private autoTimer: any;

  /** Notification-modalin sulkemismuuttuja,
   * onCloseClick ja onBackgroundClick käyttää tätä
   * - Jyri */
  closing: boolean = false;

  ngOnInit() {
    if (this.isSuccess && this.autoCloseMs && this.autoCloseMs > 0) {
      this.autoTimer = setTimeout(() => {
        this.startClosing(); // kutsutaan animaatiota ennen emit
      }, this.autoCloseMs);
    }
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  private clearTimer() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  }
  /** Alla notification-modalin sulkeutumisanimaatioon liittyvää säätöä - Jyri */
  onCloseClick() {
    this.startClosing();
  }

  onBackgroundClick(event: MouseEvent) {
    if (this.isSuccess) {
      this.startClosing();
    } else {
      event.stopPropagation();
    }
  }

  private startClosing() {
    this.clearTimer();
    this.closing = true;
    setTimeout(() => {
      this.closeModal.emit();
    }, 260); // sama kesto kuin animaatiossa modalClose
  }
  /** Alla toimiva koodi jossa ei vielä notification-modalin sulkemisanimaatiota.
  /** Käyttäjä painaa OK
  onCloseClick() {
    this.clearTimer();
    this.closeModal.emit();
  } */

  /** Käyttäjä klikkaa taustaa, wanha alkuperäinen koodi jossa myös virheessä
   * voi klikata modalin ulkopuolelta modalin kiinni */

  //  onBackgroundClick(event: MouseEvent) {
  //   this.closeModal.emit();
  // }
  //}

  /** Alla toimiva koodi jossa ei 
   * sulkemisanimaatiota notification-modalissa 
   * vielä - Jyri
  onBackgroundClick(event: MouseEvent) {
    if (this.isSuccess) {
      // Onnistunut: sallitaan sulkeminen klikkaamalla taustaa
      this.clearTimer();
      this.closeModal.emit();
    } else {
      // Epäonnistunut: estetään sulkeminen klikkaamalla taustaa.
      // Tehdään ei mitään (voimme myös estää propagation jos halutaan)
      event.stopPropagation();
      // (halutessa tähän voisi lisätä pienen visuaalisen palautteen
      //  esim. animaation tai tooltipin "Sulje painamalla OK")
    }
  }
  */
}
