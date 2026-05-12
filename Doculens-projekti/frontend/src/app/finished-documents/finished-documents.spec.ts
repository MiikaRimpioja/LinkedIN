/*import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentList } from './finished-documents';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Api } from '../services/api_service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('DocumentList', () => {
  let component: DocumentList;
  let fixture: ComponentFixture<DocumentList>;
  let apiService: jasmine.SpyObj<Api>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('Api', [
      'loadEndpoints',
      'getFinishedDocuments',
      'searchFinishedDocuments',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [DocumentList, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: Api, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    apiService = TestBed.inject(Api) as jasmine.SpyObj<Api>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(DocumentList);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('showNotificationModal', () => {
    it('should set notification properties with success status', () => {
      component.showNotificationModal(true, 'Success message');
      expect(component.notificationStatus).toBe(true);
      expect(component.notificationMessage).toBe('Success message');
      expect(component.showNotification).toBe(true);
    });

    it('should set notification properties with error status', () => {
      component.showNotificationModal(false, 'Error message');
      expect(component.notificationStatus).toBe(false);
      expect(component.notificationMessage).toBe('Error message');
      expect(component.showNotification).toBe(true);
    });
  });

  describe('handleModalClose', () => {
    it('should hide notification modal', () => {
      component.showNotification = true;
      component.handleModalClose();
      expect(component.showNotification).toBe(false);
    });
  });

  describe('modelIncomingDocument', () => {
    it('should transform document data correctly', () => {
      const mockDocument = {
        id: 1,
        filename: 'test.pdf',
        uploaded_by: 'John Doe',
        upload_date: '2025-10-07T08:10:21.123Z',
      };

      const result = component['modelIncomingDocument'](mockDocument);

      expect(result.id).toBe(1);
      expect(result.name).toBe('test.pdf');
      expect(result.author).toBe('John Doe');
      expect(result.uploadDate).toBe('2025/10/07');
      expect(result.uploadTime).toBe('08:10:21');
    });

    it('should handle different date formats', () => {
      const mockDocument = {
        id: 2,
        filename: 'another.pdf',
        uploaded_by: 'Jane Smith',
        upload_date: '2024-01-15T14:30:45.000Z',
      };

      const result = component['modelIncomingDocument'](mockDocument);

      expect(result.uploadDate).toBe('2024/01/15');
      expect(result.uploadTime).toBe('14:30:45');
    });
  });

  describe('ngOnInit', () => {
    it('should load finished documents on init success', () => {
      const mockDocuments = [
        {
          id: 1,
          filename: 'test1.pdf',
          uploaded_by: 'User1',
          upload_date: '2025-10-07T08:10:21.123Z',
        },
      ];

      apiService.loadEndpoints.and.returnValue(of(undefined));
      apiService.getFinishedDocuments.and.returnValue(of(mockDocuments));

      component.ngOnInit();

      expect(apiService.loadEndpoints).toHaveBeenCalled();
      expect(apiService.getFinishedDocuments).toHaveBeenCalled();
      expect(component.allResults.length).toBe(1);
      expect(component.selectedFiles.length).toBe(1);
      expect(component.allResults[0].name).toBe('test1.pdf');
    });

    it('should show error notification on endpoints load failure', () => {
      spyOn(component, 'showNotificationModal');
      apiService.loadEndpoints.and.returnValue(throwError(() => new Error('Load failed')));

      component.ngOnInit();

      expect(component.showNotificationModal).toHaveBeenCalledWith(
        false,
        'Tiedostojen lataus epäonnistui'
      );
    });
  });

  describe('handleClick', () => {
    it('should navigate to inspect-document with document id', () => {
      const mockDocument = { id: 123 };

      component.handleClick(mockDocument);

      expect(router.navigate).toHaveBeenCalledWith(['inspect-document', 123]);
    });
  });

  describe('handleSearch', () => {
    it('should search and update selectedFiles on success', () => {
      const mockDocuments = [
        {
          id: 1,
          filename: 'searched.pdf',
          uploaded_by: 'User1',
          upload_date: '2025-10-07T08:10:21.123Z',
        },
      ];

      component.searchTerm = 'searched';
      component.searchDate = '2025-10-07';

      apiService.searchFinishedDocuments.and.returnValue(of(mockDocuments));

      component.handleSearch();

      expect(apiService.searchFinishedDocuments).toHaveBeenCalledWith('searched', '2025-10-07');
      expect(component.searchResults.length).toBe(1);
      expect(component.selectedFiles).toEqual(component.searchResults);
    });

    it('should handle search with null date', () => {
      const mockDocuments = [
        {
          id: 1,
          filename: 'searched.pdf',
          uploaded_by: 'User1',
          upload_date: '2025-10-07T08:10:21.123Z',
        },
      ];

      component.searchTerm = 'searched';
      component.searchDate = '';

      apiService.searchFinishedDocuments.and.returnValue(of(mockDocuments));

      component.handleSearch();

      expect(apiService.searchFinishedDocuments).toHaveBeenCalledWith('searched', null);
    });

    it('should show error notification on search failure', () => {
      spyOn(component, 'showNotificationModal');
      apiService.searchFinishedDocuments.and.returnValue(
        throwError(() => new Error('Search failed'))
      );

      component.handleSearch();

      expect(component.showNotificationModal).toHaveBeenCalledWith(
        false,
        'Tiedoston haku epäonnistui'
      );
    });
  });

  describe('handleReset', () => {
    it('should reset search fields and restore all results', () => {
      component.searchTerm = 'test';
      component.searchDate = '2025-10-07';
      component.allResults = [
        {
          id: 1,
          name: 'test.pdf',
          author: 'User1',
          uploadDate: '2025/10/07',
          uploadTime: '08:10:21',
        },
      ];

      component.handleReset();

      expect(component.searchTerm).toBe('');
      expect(component.searchDate).toBe('');
      expect(component.selectedFiles).toEqual(component.allResults);
    });
  });
});
*/
