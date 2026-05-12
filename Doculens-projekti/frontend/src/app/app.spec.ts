import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { App } from './app';
import { RouterTestingModule } from '@angular/router/testing';

// App-komponentin testit
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, RouterTestingModule],
      // Sallitaan tuntemattomia elementtejä (kuten navbar standalone komponentti) templatessa
    
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  it('should create the app', () => {
    // Tarkistetaan että sovellus komponentti on luotu onnistuneesti
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render navbar and router-outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // App template sisältää vain router-outlet; navbar ei ole juuritemplaten osa
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
