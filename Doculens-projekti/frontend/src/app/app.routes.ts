import { Routes } from '@angular/router';
import { Home } from './home/home';
import { InspectDocument } from './inspect-document/inspect-document';
import { DocumentList } from './finished-documents/finished-documents';

// Koska inspect-document sivulle halutaan välittää id käytettäväksi, se on lisättävä routeen
// kaksi routea, jotta navbar:ista pääsee myös inspect-document sivulle
/* export const routes: Routes = [
  { path: '', component: Home },
  { path: 'inspect-document/:id/:isAdmin', component: InspectDocument },
  { path: 'document-list', component: DocumentList },
  // Tämän on oltava viimeisin, koska muuten se mätchää kaikkien yksisanaisten reittien kanssa jotka menee rikki
  { path: 'home/:isAdmin', component: Home },
];
*/
export const routes: Routes = [
  { path: '', redirectTo: 'home/false', pathMatch: 'full' },

  { path: 'home/:isAdmin', component: Home },

  { path: 'inspect-document/:id/:isAdmin', component: InspectDocument },

  { path: 'document-list/:isAdmin', component: DocumentList },

  { path: '**', redirectTo: 'home/false' },
];
