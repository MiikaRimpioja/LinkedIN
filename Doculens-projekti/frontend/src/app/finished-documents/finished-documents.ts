import { Component } from '@angular/core';
import { Api } from '../services/api_service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ValmisDokumentti } from '../models/valmis-document-model';
import { FormsModule } from '@angular/forms';
import { NotificationModal } from '../notification-modal/notification-modal';
import { RouterModule } from '@angular/router';
import { ModelingService } from '../services/modeling-service';

@Component({
  selector: 'app-document-list',
  imports: [FormsModule, CommonModule, NotificationModal, RouterModule],
  templateUrl: './finished-documents.html',
  styleUrl: './finished-documents.scss',
})
export class DocumentList {
  admin: boolean = false;

  // Notifikaation muuttujat
  notificationMessage: string = '';
  notificationStatus: boolean = false;
  showNotification: boolean = false;

  // Latauksen tila
  isLoading: boolean = false;
  loadingMessage: string = 'Haetaan tiedostoja...';

  // Näytettävien ja hakutuloksien taulukot
  allResults: ValmisDokumentti[] = [];
  searchResults: ValmisDokumentti[] = [];

  // Taulukko, johon tallennetaan kaikki keskeneräiset skannatut pdf -tiedostot
  // ja lisätään käyttäjän lisäämä pdf -tiedosto
  selectedFiles: ValmisDokumentti[] = [];

  // Hakuparametrit tietyn dokumentin hakuun
  searchTerm: string = '';
  searchDate: string = '';

  // ----- Konstruktori -----

  constructor(
    private api: Api,
    private router: Router,
    private route: ActivatedRoute,
    private modelingService: ModelingService
  ) {}

  // ------ Initialisaatio ------

  ngOnInit(): void {
    const isAdminValue = this.route.snapshot.paramMap.get('isAdmin');
    this.admin = isAdminValue === 'true';
    // Muotoillaan backendistä saatu taulukko objekteja, ja asetetaan ne paikalliseen taulukkoon
    this.api.loadEndpoints().subscribe({
      next: () => {
        this.api.getFinishedDocuments().subscribe((data) => {
          this.allResults = data.map((document: any) => {
            return this.modelingService.modelFinishedDocument(document);
          });
          this.selectedFiles = this.allResults;
        });
      },
      error: (err) => {
        console.error('Endpointien lataus epäonnistui');
        this.showNotificationModal(false, 'Tiedostojen lataus epäonnistui');
      },
    });
  }

  // ------ Metodit ------

  // Funktio notifikaatiomodaalin näytölle
  showNotificationModal(success: boolean, message: string) {
    this.notificationStatus = success;
    this.notificationMessage = message;
    this.showNotification = true;
    this.isLoading = false;
  }

  // Notifikaatiomodaalin Output() signaalin käsittely
  handleModalClose() {
    this.showNotification = false;
    this.isLoading = false;
  }

  // Dokumentin vienti inspektointisivulle, route parametreihin laitetaan id
  handleClick(document: any) {
    this.router.navigate(['inspect-document', document.id, this.admin]);
  }

  // Palataan kotinäkymään
  handleReturnHome() {
    this.router.navigate(['home', this.admin]);
  }

  // Haetaan tietty (tietyt) dokumentti
  handleSearch() {
    this.api.searchFinishedDocuments(this.searchTerm, this.searchDate || null).subscribe({
      next: (data) => {
        this.searchResults = data.map((document: any) => {
          return this.modelingService.modelFinishedDocument(document);
        });
        this.selectedFiles = this.searchResults;
      },
      error: (err) => {
        console.error('Haku epäonnistui');
        this.showNotificationModal(false, 'Tiedoston haku epäonnistui');
      },
    });
  }
  handleReset() {
    this.searchTerm = '';
    this.searchDate = '';
    this.selectedFiles = this.allResults;
  }
}
