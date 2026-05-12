import { Component } from '@angular/core';
import { Api } from '../services/api_service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DisplayDocumentModel } from '../models/display-document-home';
import { FormsModule } from '@angular/forms';
import { NotificationModal } from '../notification-modal/notification-modal';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ModelingService } from '../services/modeling-service';
import keskenFeikkidata from '../../assets/kesken_feikkidata.json';

@Component({
  selector: 'app-home',
  imports: [FormsModule, CommonModule, NotificationModal, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  // Notifikaation asetuksia
  notificationMessage: string = '';
  notificationStatus: boolean = false;
  showNotification: boolean = false;

  // Tiedoston latausnotifikaation muuttujat
  isUploading: boolean = false;
  uploadLoadingMessage: string = 'Tiedostoa käsitellään, odota hetki...';

  // Hakumuuttuja
  searchTerm: number | null = null;

  // Käyttäjämuuttuja
  admin: boolean = false;

  // Lavanumero
  palletNumber: number | null = null;

  // Taulukko, johon tallennetaan kaikki keskeneräiset skannatut pdf -tiedostot
  allFiles: DisplayDocumentModel[] = [];

  // Taulukko, johon tallennetaan näytettävät dokumentit
  displayedFiles: DisplayDocumentModel[] = [];

  // Näytettävien dokumenttien määrämuuttuja
  displayedAmount: number = 5;

  // ----- Konstruktori -----

  constructor(
    private api: Api,
    private router: Router,
    private route: ActivatedRoute,
    private modelingService: ModelingService
  ) {}

  // ------ Metodi näytettävien dokumenttien määrän määrittämiseen ------
  private displayAmount(amount: number, originalArray: DisplayDocumentModel[]) {
    this.displayedFiles = originalArray.slice(0, amount);
  }

  // Metodi keskeneräisten dokumenttejen lataukseen ja asetukseen paikalliseen taulukkoon
  private loadUnfinishedDocuments(forceReload = false): void {
    this.api.loadEndpoints(forceReload).subscribe({
      next: () => {
        this.api.getUnfinishedDocuments().subscribe({
          next: (data) => {
            const returnedFiles: DisplayDocumentModel[] = data.map((document: any) =>
              this.modelingService.modelUnfinishedDocument(document)
            );
            this.allFiles = returnedFiles;
            this.displayAmount(this.displayedAmount, this.allFiles);
          },
          error: (err) => {
            console.error('Virhe keskeneräisten tiedostojen haussa');
            this.showNotificationModal(false, 'Keskeneräisten tiedostojen haku epäonnistui');
          },
        });
      },
      error: (err) => {
        console.error('Endpointien lataus epäonnistui');
        this.showNotificationModal(false, 'Dokumenttien lataus epäonnistui');
      },
    });
  }

  // Metodi notifikaatiomodaalin näytölle
  showNotificationModal(success: boolean, message: string) {
    this.notificationStatus = success;
    this.notificationMessage = message;
    this.showNotification = true;
    this.isUploading = false;
  }

  // Metodi notifikaatiomodaalin Output() signaalin käsittelyyn
  handleModalClose() {
    this.showNotification = false;
    this.isUploading = false;
  }

  // ---- Initialisaatio ----

  ngOnInit(): void {
    this.admin = this.route.snapshot.paramMap.get('isAdmin') === 'true';
    this.loadUnfinishedDocuments(true);
  }

  // Dokumentin vienti inspektointisivulle, route parametreihin laitetaan id & admin boolean
  handleClick(document: any) {
    this.router.navigate(['inspect-document', document.id, this.admin]);
  }

  // Näkymän siirto DocumentList komponenttiin
  handleFinishedDocuments() {
    this.router.navigate(['document-list', this.admin]);
  }

  // ----- Käyttäjän tiedoston lataus -----

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    // Tallennetaan käyttäjän lisäämä tiedosto muuttujaan
    const file = input.files[0];
    const filename = file.name;

    // Tarkastetaan onko samanniminen tiedosto jo olemassa
    const existingFile = this.displayedFiles.find((f) => f.name === file.name);
    if (existingFile) {
      this.showNotificationModal(false, 'Samanniminen tiedosto on jo olemassa!');
      return;
    }

    if (file.type !== 'application/pdf') {
      this.showNotificationModal(false, 'Valitse PDF -tiedosto');
      return;
    }

    this.isUploading = true;
    this.showNotification = true;
    this.notificationMessage = this.uploadLoadingMessage;
    this.notificationStatus = false;

    // Tiedoston muuntaminen Uint8Array muotoon
    const reader = new FileReader();

    reader.onload = () => {
      // Tarkastetaan onko palautus ArrayBufferin sisällä
      if (reader.result instanceof ArrayBuffer) {
        const uint8Array = new Uint8Array(reader.result);

        // Lähetetään Uint8Array backendille
        this.api.uploadPdf(uint8Array, filename, this.palletNumber).subscribe({
          next: (response) => {
            this.showNotificationModal(true, 'Tiedoston lähetys onnistui');
            // Datan refreshointi
            this.loadUnfinishedDocuments();

            // Jos tavan käyttäjä, siirrytään viimeisimmän ladatun tiedoston id:llä inspect-document sivulle
            if (!this.admin) {
              this.router.navigate(['inspect-document', this.allFiles[0].id]);
            }
          },
          error: (error) => {
            console.error('File upload failed');
            this.showNotificationModal(false, 'Tiedoston lähetys epäonnistui');
          },
        });
      } else {
        console.error('Unexpected file reader result');
      }
    };

    // Luetaan tiedosto ArrayBufferina
    reader.readAsArrayBuffer(file);
  }

  // ------ Hakupalkin metodit ------

  handleSearch(searchTerm: number | null) {
    const searchResult = this.allFiles.find((document) => document.pallet === searchTerm);
    if (searchResult) {
      this.searchTerm = null;
      this.router.navigate(['inspect-document', searchResult.id, this.admin]);
    } else {
      this.showNotificationModal(false, 'Lähetyslistaa ei löytynyt');
      this.searchTerm = null;
    }
  }
  handleReset() {
    this.searchTerm = null;
  }

  // ------ Määrän valinnan metodi ------
  handleAmountChange() {
    this.displayAmount(this.displayedAmount, this.allFiles);
  }

  // ------ Käyttäjän vaihdon metodi -------
  handleUserChange() {
    this.admin = !this.admin;
  }
}
