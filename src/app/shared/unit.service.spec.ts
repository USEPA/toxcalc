import { TestBed, inject } from '@angular/core/testing';

import { UnitStandardizationService } from './standardization.service';

describe('UnitService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UnitService]
    });
  });

  it('should be created', inject([UnitService], (service: UnitService) => {
    expect(service).toBeTruthy();
  }));
});
