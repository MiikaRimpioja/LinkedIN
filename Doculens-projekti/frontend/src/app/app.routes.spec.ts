import { Location } from '@angular/common';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { routes } from './app.routes';
import { Home } from './home/home';
import { InspectDocument } from './inspect-document/inspect-document';
import { DocumentList } from './finished-documents/finished-documents';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('App Routing', () => {
  let router: Router;
  let location: Location;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(routes),
        HttpClientTestingModule,
        Home,
        InspectDocument,
        DocumentList,
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should navigate to Home when path is empty', fakeAsync(() => {
    router.navigate(['']);
    tick();

    expect(location.path()).toBe('/home/false');
  }));

  it('should navigate to Home on root path', fakeAsync(() => {
    router.navigate(['/']);
    tick();

    expect(location.path()).toBe('/home/false');
  }));

  it('should navigate to InspectDocument with id parameter', fakeAsync(() => {
    router.navigate(['/inspect-document', 123, true]);
    tick();

    expect(location.path()).toBe('/inspect-document/123/true');
  }));

  it('should navigate to InspectDocument without id', fakeAsync(() => {
    router.navigate(['/inspect-document']);
    tick();

    expect(location.path()).toBe('/home/false');
  }));

  it('should navigate to DocumentList', fakeAsync(() => {
    router.navigate(['/document-list']);
    tick();

    expect(location.path()).toBe('/home/false');
  }));

  it('should have Home component on root route', fakeAsync(() => {
    router.navigate(['']);
    tick();

    // Tarkista että reitti sisältää Home-komponentin
    const route = router.routerState.root.firstChild;
    expect(route?.component).toBe(Home);
  }));

  it('should have InspectDocument component on inspect-document route', fakeAsync(() => {
    router.navigate(['/inspect-document', 1, 'false']);
    tick();

    const route = router.routerState.root.firstChild;
    expect(route?.component).toBe(InspectDocument);
  }));

  it('should have DocumentList component on document-list route', fakeAsync(() => {
    router.navigate(['/document-list', 'false']);
    tick();

    const route = router.routerState.root.firstChild;
    expect(route?.component).toBe(DocumentList);
  }));

  it('should have id parameter in InspectDocument route', fakeAsync(() => {
    router.navigate(['/inspect-document', 42, 'false']);
    tick();

    const route = router.routerState.root.firstChild;
    if (route) {
      let paramId: string | undefined;
      route.params.subscribe((params) => {
        paramId = params['id'];
      });
      expect(paramId).toBe('42');
    }
  }));

  it('should route to InspectDocument when navigating with dynamic id', fakeAsync(() => {
    const id = 42;
    router.navigate(['/inspect-document', id, 'false']);
    tick();

    expect(location.path()).toBe(`/inspect-document/${id}/false`);
    const route = router.routerState.root.firstChild;
    if (route) {
      let paramId: string | undefined;
      route.params.subscribe((params) => {
        paramId = params['id'];
      });
      expect(paramId).toBe(id.toString());
    }
  }));

  it('should navigate from Home to DocumentList', fakeAsync(() => {
    router.navigate(['']);
    tick();
    expect(location.path()).toBe('/home/false');

    router.navigate(['/document-list', 'false']);
    tick();
    expect(location.path()).toBe('/document-list/false');
  }));

  it('should navigate from DocumentList to InspectDocument with id', fakeAsync(() => {
    router.navigate(['/document-list', 'false']);
    tick();
    expect(location.path()).toBe('/document-list/false');

    router.navigate(['/inspect-document', 5, 'false']);
    tick();
    expect(location.path()).toBe('/inspect-document/5/false');
  }));

  it('should navigate from InspectDocument back to Home', fakeAsync(() => {
    router.navigate(['/inspect-document', 1, 'false']);
    tick();
    expect(location.path()).toBe('/inspect-document/1/false');

    router.navigate(['']);
    tick();
    expect(location.path()).toBe('/home/false');
  }));
});
