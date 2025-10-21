import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dice8Component } from './dice-8.component';

describe('Dice8Component', () => {
  let component: Dice8Component;
  let fixture: ComponentFixture<Dice8Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dice8Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dice8Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
