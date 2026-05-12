import { TestBed } from '@angular/core/testing';

import { Endpoints } from './endpoints_service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Endpoints', () => {
  let service: Endpoints;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(Endpoints);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
