import { TestBed } from '@angular/core/testing';

import { DiceFactoryService } from './dice-factory.service';

describe('DiceFactoryService', () => {
  let service: DiceFactoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiceFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
