import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import feikkidata from '../../assets/feikkidata.json';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Modal } from '../png-modal/png-modal';

import { NotificationModal } from '../notification-modal/notification-modal';

// Api service
import { Api } from '../services/api_service';

// Mallit ja mallinnus -service
import { TuoteriviModel } from '../models/tuoterivi-model';
import { ModelingService } from '../services/modeling-service';
import { ReceiverModel } from '../models/receiver-model';
import { SenderModel } from '../models/sender-model';

@Component({
  selector: 'app-inspect-document',
  imports: [FormsModule, Modal, NotificationModal, RouterModule],
  templateUrl: './inspect-document.html',
  styleUrl: './inspect-document.scss',
})
export class InspectDocument {
  // Tietyn lista-itemin haun muuttujat
  @ViewChildren('productRow') productRows!: QueryList<ElementRef>;

  // input-field-qty focusointiin
  @ViewChildren('qtyInput') qtyInputs!: QueryList<ElementRef>;

  // Hakutermi
  searchTerm: string = '';

  // Lähetä painikkeen näytön muuttuja
  isAllChecked: boolean = true;

  // Admin näkymä
  admin: boolean = false;

  // Vastaanottaja
  receiver!: ReceiverModel;
  sender!: SenderModel;

  // Mobiili swippauksen muuttujat
  private touchStartX = 0;
  private touchEndX = 0;

  // Tuoterivin highlightaukseen
  selectedProductId: number | null = null;

  // Notifikaation muuttujat
  notificationMessage: string = '';
  notificationStatus: boolean = false;
  showNotification: boolean = false;

  // Pdf modaalin muuttujat
  showModal: boolean = false;
  fileUrl!: string;
  pngSource!: string;

  // Datan muuttujat
  data: any;
  tuoteRivit: TuoteriviModel[] = [];
  documentId!: string | number;

  // Titlen muuttuja
  company: string = '';

  // ----- Konstruktori -----

  constructor(
    private api: Api,
    private router: Router,
    private route: ActivatedRoute,
    private modelingService: ModelingService
  ) {}

  // Funktio notifikaatiomodaalin näytölle
  showNotificationModal(success: boolean, message: string) {
    this.notificationStatus = success;
    this.notificationMessage = message;
    this.showNotification = true;
  }

  // Notifikaatiomodaalin Output() signaalin käsittely
  handleModalClose() {
    this.showNotification = false;
  }

  extractProductName(fieldName: string): string | null {
    if (!fieldName) return null;

    // Otetaan ensimmäinen sana ennen ensimmäistä välilyöntiä
    const name = fieldName.split(' ')[0];

    // Muunnetaan ensimmäinen kirjain isoksi, muut pieneksi
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }

  // ----- Lähettäjän ja vastaanottajan tietojen muotoilu -----

  private getSenderData(sender: any): SenderModel {
    return {
      address: sender.address,
      city: sender.city,
      company: sender.company,
      contact_person: sender.contact_person,
      country: sender.country,
      postal_code: sender.postal_code,
    };
  }

  private getReceiverData(receiver: any): ReceiverModel {
    return {
      address: receiver.address,
      city: receiver.city,
      contact_person: receiver.contact_person,
      country: receiver.country,
      postal_code: receiver.postal_code,
    };
  }

  // ------- Sivun alustus -------

  ngOnInit(): void {
    // Haetaan dokumentin id routen parametreistä
    this.documentId = this.route.snapshot.paramMap.get('id')!;
    this.admin = this.route.snapshot.paramMap.get('isAdmin') === 'true';

    // ------- PDF modaalin pdf -tiedoston haku -------

    this.api.getSpecificDocumentPDF(this.documentId).subscribe({
      next: (pdfBlob) => {
        if (pdfBlob.type !== 'application/pdf') {
          this.notificationMessage = 'Palvelin ei palauttanut PDF-tiedostoa.';
          return;
        }
        const blobUrl = URL.createObjectURL(pdfBlob);
        const fullUrl = `${blobUrl}#navpanes=0&statusbar=0&view=Fit`;
        this.fileUrl = fullUrl;
      },
      error: async (err: HttpErrorResponse) => {
        if (err.error instanceof Blob && err.error.type === 'application/json') {
          try {
            const text = await err.error.text();
            const json = JSON.parse(text);
            this.notificationMessage = json.error
              ? json.syy
                ? `${json.error}: ${json.syy}`
                : json.error
              : 'Tuntematon virhe';
          } catch {
            this.notificationMessage = 'Virheellinen JSON-virhepalautus';
          }
        } else {
          this.notificationMessage = 'PDF:n haku epäonnistui (palvelinvirhe)';
        }
      },
    });

    // ------- Dokumentin tuoterivien haku -------

    this.api.getSpecificUnfinishedDocument(this.documentId).subscribe({
      next: (data) => {
        if (data.sender) {
          // Otetaan lähettäjän tiedot
          this.sender = this.getSenderData(data.sender);

          // Otetaan lähettäjän yriysnimi
          const senderCompany = data.sender.company;
          if (senderCompany) {
            this.company = senderCompany;
          } else {
            console.error('Lähettäjää ei löytynyt');
          }
        }
        if (data.receiver) {
          // Otetaan vastaanottajan tiedot
          this.receiver = this.getReceiverData(data.receiver);
        }
        // Asetetaan dataksi vain products -taulukko
        this.data = data.products;
        // Formatoidaan tuotteen nimi oikeaan muotoon
        const mappedData = this.data.map((rivi: any) => {
          return {
            ...rivi,
            // Jos extractProductName palauttaa null, pidetään alkuperäinen nimi
            product_name: this.extractProductName(rivi.product_name) || rivi.product_name,
          };
        });
        // Formatoidaan alkio oikeaan muotoon (poistetaan loput avaimet)
        this.tuoteRivit = mappedData.map((rivi: any) => {
          return this.modelingService.modelProductRow(rivi);
        });
      },
      error: (error) => {
        console.error('Dokumentin haku epäonnistui');
        this.showNotificationModal(false, 'Dokumentin haku epäonnistui');
      },
    });
    this.allChecked();
  }

  // ------- Modaalin avaus -------

  switchModal() {
    this.showModal = !this.showModal;
  }

  // ------- Tuoterivien lähetys backendiin -------

  handleSubmit() {
    this.api.updateDocument(this.tuoteRivit).subscribe({
      next: (response) => {
        this.showNotificationModal(true, 'Tallennus onnistui');
        this.router.navigate(['home', this.admin]);
      },
      error: (error) => {
        this.showNotificationModal(false, 'Tallennus epäonnistui');
        console.error('Tallennus epäonnistui');
      },
    });
  }

  // ------ Kotinäkymään palaamisen metodi -------
  handleReturn() {
    this.router.navigate(['home', this.admin]);
  }

  // ------- Tietyn tuoterivin haku & fokusointi -------

  scrollToProduct() {
    if (!this.searchTerm) return;

    const normalizedSearch = this.searchTerm.trim().toLowerCase();

    // Etsi tarkka osuma ensin, codes sisältää document.code arvon & document.other_codes taulukon
    let index = this.tuoteRivit.findIndex((tuote) => {
      const codes = [tuote.code, ...(tuote.other_codes?.map((code) => code.code_value) ?? [])];
      // Jos mikä tahansa alkio vastaa täysin normalisoitua hakutermiä, .some() palauttaa true, muuten false
      return codes.some((code) => code?.toLowerCase() === normalizedSearch);
    });

    // Jos tarkkaa osumaa ei löytynyt, etsitään osittainen osuma samasta taulukosta
    if (index === -1) {
      index = this.tuoteRivit.findIndex((tuote) => {
        const codes = [tuote.code, ...(tuote.other_codes?.map((code) => code.code_value) ?? [])];
        // Jos mikä tahansa alkio vastaa osittain normalisoitua hakutermiä, .some() palauttaa true, muuten false
        return codes.some((code) => code?.toLowerCase().includes(normalizedSearch));
      });
    }

    // Jos löytyi osuma
    const target = this.productRows.get(index);
    const targetQtyInput = this.qtyInputs.get(index);
    const foundProduct = this.tuoteRivit[index];

    if (foundProduct && target) {
      this.selectedProductId = foundProduct.product_line_id;
      target.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Skrollausanimaation jälkeen odotetaan ennenkuin focusoidaan
      setTimeout(() => {
        targetQtyInput?.nativeElement.focus();
      }, 600);

      // Poistetaan highlight tyylitys ajastimen jälkeen
      setTimeout(() => (this.selectedProductId = null), 2000);
    }
  }

  // ------- Tuoterivin tarkastus -------

  handleCheck(tuote: any) {
    tuote.checked = !tuote.checked;
    this.allChecked();
  }

  // ------- Kaikkien tuoterivien checked -arvojen tarkastus -------

  allChecked(): void {
    // Palauttaa true jos tuoteriveissä on tuotteita ja kaikkien checked avaimilla on arvo true
    if (this.tuoteRivit.length > 0 && this.tuoteRivit.every((tuote) => tuote.checked)) {
      this.isAllChecked = false;
    } else {
      this.isAllChecked = true;
    }
  }

  // ----- Checkauksen slidaus kosketusnäytöllä -----

  activeRow: HTMLDivElement | null = null;
  onTouchStart(event: TouchEvent, row: HTMLElement) {
    this.touchStartX = event.touches[0].clientX;
    this.activeRow = row as HTMLDivElement;
    row.style.transition = 'none'; // poista animaatio alussa
  }
  onTouchMove(event: TouchEvent) {
    const currentX = event.touches[0].clientX;
    const deltaX = currentX - this.touchStartX;

    if (this.activeRow) {
      this.activeRow.style.transform = `translateX(${deltaX}px)`;
    }
  }

  onTouchEnd(event: TouchEvent, tuote: any) {
    const endX = event.changedTouches[0].clientX;
    const swipeDistance = endX - this.touchStartX;

    if (this.activeRow) {
      this.activeRow.style.transition = 'transform 0.3s ease';

      if (swipeDistance > 150) {
        tuote.checked = true;
        this.activeRow.style.transform = 'translateX(100px)';
      } else {
        this.activeRow.style.transform = 'translateX(0)';
      }
      this.activeRow.style.transform = 'translateX(0)';
      this.activeRow = null;
      this.allChecked();
    }
  }
  handleReset(): void {
    this.searchTerm = '';
  }
  handleUserChange() {
    this.admin = !this.admin;
  }
}
