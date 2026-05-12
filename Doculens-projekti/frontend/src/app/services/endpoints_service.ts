import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Endpoints {
  http = inject(HttpClient);
  getEndpoints(): Observable<any> {
    const headers = new HttpHeaders({
      username: 'softa',
      password: 'Password',
    });
    return this.http.get('/api/endpoints', { headers });
  }
}
