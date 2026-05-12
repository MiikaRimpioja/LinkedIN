import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Endpoints } from './endpoints_service';

@Injectable({
  providedIn: 'root',
})
export class Api {
  http = inject(HttpClient);
  endpoints = inject(Endpoints);

  // Cache
  private endpointsCache: any = null;
  private endpointsLoaded = false;

  // Headeriin tuleva tunnus
  username: string = 'softa';
  password: string = 'Password';

  // Montako dokumenttia haetaan
  amount: number = 10;

  // Keskeneräisen tiedoston url
  keskenUrl: any;

  // Keskeneräisen tiedoston alkuperäisen skannauksen pdf:n url
  keskenPdfUrl: any;

  // Valmiin tiedoston url
  valmiitUrl: any;

  valmiitHakuUrl: any = '';

  // Käyttäjän lataaman tiedoston (home-sivu) lähetys url
  uploadPdfUrl: any;

  // Haetaan urlit servicen kautta ja asetetaan muuttujiin.
  loadEndpoints(forceReload = false): Observable<void> {
    if (this.endpointsLoaded && !forceReload) {
      // Already loaded, return an observable that immediately completes
      return new Observable<void>((observer) => {
        observer.next();
        observer.complete();
      });
    }
    return new Observable<void>((observer) => {
      this.endpoints.getEndpoints().subscribe({
        next: (response) => {
          this.endpointsCache = response;
          this.endpointsLoaded = true;

          // Set URLs from cached response
          if (response.upload_ocr) {
            this.uploadPdfUrl = response.upload_ocr;
          } else {
            console.error('Missing upload_ocr in response!');
          }
          if (response.kesken_url) {
            this.keskenUrl = response.kesken_url;
          } else {
            console.error('Missing kesken_url in response!');
          }
          if (response.keskenpdf_url) {
            this.keskenPdfUrl = response.keskenpdf_url;
          } else {
            console.error('Missing keskenpdf_url in response!');
          }
          if (response.valmiit_url) {
            this.valmiitUrl = response.valmiit_url;
          } else {
            console.error('Missing valmiit_url in response!');
          }
          if (response.valmiit_haku_url) {
            this.valmiitHakuUrl = response.valmiit_haku_url;
          } else {
            console.error('Missing valmiit_haku_url in response!');
          }
          observer.next();
          observer.complete();
        },
        error: (err) => {
          console.error('Failed to fetch endpoints:', err);
          observer.error(err);
        },
      });
    });
  }

  // Haetaan kaikki keskeneräiset dokumentit (Home sivu)
  getUnfinishedDocuments(): Observable<any> {
    if (!this.keskenUrl) {
      throw new Error('keskenUrl is not initialized!');
    }
    const headers = new HttpHeaders({
      username: this.username,
      password: this.password,
      // Maksimimäärä dokumentteja joita haetaan
      amount: this.amount,
    });
    // Tulee taulukko, jossa JSON -objekteja
    const response = this.http.get(this.keskenUrl, { headers });
    return response;
  }

  // Haetaan tietty keskeneräinen dokumentti (Inspect sivu)
  getSpecificUnfinishedDocument(id: string | number): Observable<any> {
    const headers = new HttpHeaders({
      username: this.username,
      password: this.password,
    });
    const url = `${this.keskenUrl}/${id}`;
    const response = this.http.get(url, { headers });
    return response;
  }

  // Haetaan tietyn keskeneräisen dokumentin pdf
  getSpecificDocumentPDF(id: string | number): Observable<any> {
    const headers = new HttpHeaders({
      username: this.username,
      password: this.password,
    });
    const url = `${this.keskenPdfUrl}/${id}`;
    const response = this.http.get(url, { headers, responseType: 'blob' });
    return response;
  }

  // Postataan muokattu tiedosto valmiiden dokumenttejen urliin
  updateDocument(object: any): Observable<any> {
    const headers = new HttpHeaders({
      username: this.username,
      password: this.password,
    });
    return this.http.post(this.valmiitUrl, object, { headers });
  }

  // Haetaan valmiit dokumentit
  getFinishedDocuments(): Observable<any> {
    const headers = new HttpHeaders({
      username: this.username,
      password: this.password,
    });
    const response = this.http.get(this.valmiitUrl, { headers });
    return response;
  }

  // Valmiin dokumentin haku termien perusteella
  searchFinishedDocuments(
    searchTerm: string | number,
    searchDate: string | null = null
  ): Observable<any> {
    const headers = new HttpHeaders({
      username: this.username,
      password: this.password,
    });

    let params = new HttpParams().set('searchTerm', searchTerm.toString());
    // Jos searchDate on määritelty, lisätään se parametreihin
    if (searchDate) {
      params = params.set('searchDate', searchDate);
    }
    const response = this.http.get(this.valmiitHakuUrl, { headers, params });

    return response;
  }

  // Käyttäjän lataaman tiedoston (home-sivu) lähetys backendiin
  uploadPdf(fileData: Uint8Array, fileName: string, palletNumber: number | null): Observable<any> {
    console.log('Annettu lavanumero: ', palletNumber);
    const normalArray = new Uint8Array(fileData);
    const blob = new Blob([normalArray], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, fileName);
    // Lisätään lavanumero vain jos se on määritelty
    if (palletNumber !== null && palletNumber !== undefined) {
      formData.append('pallet_number', palletNumber.toString());
    }
    const headers = new HttpHeaders({
      username: this.username,
      password: this.password,
    });

    return this.http.post(this.uploadPdfUrl, formData, { headers });
  }
}
